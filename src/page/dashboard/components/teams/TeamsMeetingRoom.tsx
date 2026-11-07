import React, { useState, useEffect, useRef } from 'react';
import {
  teamsService,
  type MeetingData,
  type RaisedHand,
  type LivePoll,
  type DirectoryUser,
} from '../../../../services/teams.service';
import { socketService } from '../../../../services/socket.service';
import { teacherService } from '../../../../services/teacher.service';
import { academicService, type Schedule } from '../../../../services/academic.service';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Hand,
  Users,
  Share2,
  PenTool,
  Vote,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface RemotePeer {
  userId: string;
  user?: DirectoryUser;
  stream?: MediaStream;
  pc?: RTCPeerConnection;
  isSpeaking?: boolean;
}

const RemoteVideoTile: React.FC<{ peer: RemotePeer }> = ({ peer }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  const hasVideoTrack = peer.stream?.getVideoTracks().some((t) => t.enabled);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-900 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center min-h-[220px]">
      {hasVideoTrack && peer.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="h-16 w-16 rounded-full bg-indigo-600/40 text-indigo-200 flex items-center justify-center text-xl font-bold mb-2">
            {peer.user?.fullName?.charAt(0) || 'U'}
          </div>
          <span className="text-xs text-gray-300 font-semibold">
            {peer.user?.fullName || 'Người tham gia'}
          </span>
          <span className="text-[10px] text-gray-500 font-mono mt-0.5">
            {peer.user?.studentCode || peer.user?.teacherCode || 'Kết nối P2P'}
          </span>
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-xs">
          WebRTC Live
        </span>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold text-white truncate">
            {peer.user?.fullName || 'Người tham gia'}
          </span>
          {peer.user?.role && (
            <span className="rounded bg-indigo-500/40 text-indigo-200 px-1.5 py-0.2 text-[9px] font-bold">
              {peer.user.role}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400">
          <Mic className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
};

interface RealAttendanceRecord {
  userId: string;
  fullName: string;
  studentCode?: string;
  studentProfileId?: string;
  role: string;
  joinedAt: string;
  leftAt?: string;
  totalDurationMinutes: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
}

interface TeamsMeetingRoomProps {
  meeting: MeetingData;
  user: any;
  directoryUsers?: DirectoryUser[];
  onLeave: () => void;
}

export const TeamsMeetingRoom: React.FC<TeamsMeetingRoomProps> = ({
  meeting,
  user,
  directoryUsers = [],
  onLeave,
}) => {
  const isHost = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const meetingKey = meeting.roomCode || meeting.id;

  // Pre-join state
  const [isJoined, setIsJoined] = useState(false);

  // 1. Hardware media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);

  // References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const prejoinVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 2. WebRTC P2P Peers & Candidates Queue
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map());
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, any[]>>(new Map());

  // Meeting duration
  const [durationSeconds, setDurationSeconds] = useState(0);
  const durationSecondsRef = useRef(0);
  durationSecondsRef.current = durationSeconds;

  // Real Attendance tracking
  const [realAttendance, setRealAttendance] = useState<Map<string, RealAttendanceRecord>>(new Map());

  // Hands Queue
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [handsQueue, setHandsQueue] = useState<RaisedHand[]>([]);
  const [showHandsModal, setShowHandsModal] = useState(false);

  // Live Poll State
  const [activePoll, setActivePoll] = useState<LivePoll | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '', '']);
  const [userVotedOption, setUserVotedOption] = useState<string | null>(null);

  // Whiteboard State
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [penColor, setPenColor] = useState('#6366f1');
  const [penWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDrawPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Host Moderation Modal
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [isMuteForced, setIsMuteForced] = useState(false);

  // End Meeting & Attendance Modal
  const [showEndMeetingModal, setShowEndMeetingModal] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(`https://storage.preskool.edu.vn/recordings/${meetingKey}.mp4`);
  const [savingRecording, setSavingRecording] = useState(false);
  const [savedRecordingSuccess, setSavedRecordingSuccess] = useState(false);

  // ERP Roll Call integration
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [savingRollCall, setSavingRollCall] = useState(false);
  const [rollCallMessage, setRollCallMessage] = useState<string | null>(null);
  const [rollCallError, setRollCallError] = useState<string | null>(null);

  // Lookup helper
  const findUser = (uid: string): DirectoryUser | undefined => {
    return directoryUsers.find((u) => u.id === uid);
  };

  // ============================================================
  // 1. INITIALIZE HARDWARE (WEBCAM, MIC & AUDIO ANALYSER)
  // ============================================================
  useEffect(() => {
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animFrame: number | null = null;

    const startLocalMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });

        setLocalStream(stream);
        localStreamRef.current = stream;
        setMediaError(null);

        if (prejoinVideoRef.current) {
          prejoinVideoRef.current.srcObject = stream;
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Setup real-time voice volume detection via AudioContext
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
            const source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              if (!analyser) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioVolume(Math.round(avg));
              animFrame = requestAnimationFrame(checkVolume);
            };
            checkVolume();
          }
        } catch (e) {
          console.warn('AudioContext volume meter warning:', e);
        }
      } catch (err: any) {
        console.warn('Cannot open webcam/microphone:', err);
        setMediaError(
          err.name === 'NotAllowedError'
            ? 'Trình duyệt chưa được cấp quyền Camera/Microphone.'
            : 'Không phát hiện thiết bị Camera hoặc Microphone trên thiết bị này.'
        );
      }
    };

    startLocalMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      if (animFrame) {
        cancelAnimationFrame(animFrame);
      }
    };
  }, []);

  // Sync video streams to elements when joined or stream changed
  useEffect(() => {
    if (prejoinVideoRef.current && localStream) {
      prejoinVideoRef.current.srcObject = localStream;
    }
    if (localVideoRef.current && localStream && isCameraOn) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isJoined, isCameraOn]);

  // Sync screen share stream to screenVideoRef
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);

  // Duration timer when joined
  useEffect(() => {
    if (!isJoined) return;
    const timer = setInterval(() => {
      setDurationSeconds((p) => p + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isJoined]);

  // Record self attendance
  useEffect(() => {
    if (isJoined && user?.id) {
      const selfUser = findUser(user.id);
      setRealAttendance((prev) => {
        const copy = new Map(prev);
        copy.set(user.id, {
          userId: user.id,
          fullName: user.fullName || user.username || 'Bạn',
          studentCode: selfUser?.studentCode,
          studentProfileId: selfUser?.studentProfileId || user?.student?.id,
          role: user.role || 'STUDENT',
          joinedAt: new Date().toLocaleTimeString('vi-VN'),
          totalDurationMinutes: 1,
          status: 'PRESENT',
        });
        return copy;
      });
    }
  }, [isJoined, user?.id]);

  // ============================================================
  // 2. WEBRTC P2P SIGNALING MATCHING teams.socket.ts
  // ============================================================
  useEffect(() => {
    if (!isJoined) return;

    const rtcConfig: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const createPeerConnection = (targetUserId: string): RTCPeerConnection => {
      if (peerConnectionsRef.current.has(targetUserId)) {
        return peerConnectionsRef.current.get(targetUserId)!;
      }

      const pc = new RTCPeerConnection(rtcConfig);

      // Add local media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Send local ICE candidates to target user
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.emit('webrtc_ice_candidate', {
            meetingId: meetingKey,
            targetUserId,
            candidate: event.candidate,
          });
        }
      };

      // Receive remote tracks
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        const dirUser = findUser(targetUserId);

        setRemotePeers((prev) => {
          const copy = new Map(prev);
          copy.set(targetUserId, {
            userId: targetUserId,
            user: dirUser,
            stream: remoteStream,
            pc,
          });
          return copy;
        });
      };

      peerConnectionsRef.current.set(targetUserId, pc);
      return pc;
    };

    // 1. Emit string meetingId on join
    socketService.emit('join_meeting', meetingKey);

    // 2. When another user joins: initiate WebRTC Offer
    const handleUserJoined = async (data: { userId: string }) => {
      const remoteUserId = data?.userId;
      if (!remoteUserId || remoteUserId === user?.id) return;

      // Track attendance
      const dirUser = findUser(remoteUserId);
      setRealAttendance((prev) => {
        const copy = new Map(prev);
        if (!copy.has(remoteUserId)) {
          copy.set(remoteUserId, {
            userId: remoteUserId,
            fullName: dirUser?.fullName || 'Người tham gia',
            studentCode: dirUser?.studentCode,
            studentProfileId: dirUser?.studentProfileId,
            role: dirUser?.role || 'MEMBER',
            joinedAt: new Date().toLocaleTimeString('vi-VN'),
            totalDurationMinutes: 1,
            status: 'PRESENT',
          });
        }
        return copy;
      });

      // Create Offer
      const pc = createPeerConnection(remoteUserId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketService.emit('webrtc_offer', {
          meetingId: meetingKey,
          targetUserId: remoteUserId,
          sdp: offer,
        });
      } catch (err) {
        console.warn('Error creating WebRTC offer:', err);
      }
    };

    // 3. When receiving WebRTC Offer
    const handleWebRTCOffer = async (data: { fromUserId: string; sdp: any; meetingId: string }) => {
      if (data?.meetingId !== meetingKey || !data.fromUserId || data.fromUserId === user?.id) return;

      const fromUserId = data.fromUserId;
      const pc = createPeerConnection(fromUserId);

      // Track attendance
      const dirUser = findUser(fromUserId);
      setRealAttendance((prev) => {
        const copy = new Map(prev);
        if (!copy.has(fromUserId)) {
          copy.set(fromUserId, {
            userId: fromUserId,
            fullName: dirUser?.fullName || 'Người tham gia',
            studentCode: dirUser?.studentCode,
            studentProfileId: dirUser?.studentProfileId,
            role: dirUser?.role || 'MEMBER',
            joinedAt: new Date().toLocaleTimeString('vi-VN'),
            totalDurationMinutes: 1,
            status: 'PRESENT',
          });
        }
        return copy;
      });

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        // Drain pending candidates
        const pending = pendingCandidatesRef.current.get(fromUserId) || [];
        for (const cand of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }
        pendingCandidatesRef.current.delete(fromUserId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketService.emit('webrtc_answer', {
          meetingId: meetingKey,
          targetUserId: fromUserId,
          sdp: answer,
        });
      } catch (err) {
        console.warn('Error handling WebRTC offer:', err);
      }
    };

    // 4. When receiving WebRTC Answer
    const handleWebRTCAnswer = async (data: { fromUserId: string; sdp: any; meetingId: string }) => {
      if (data?.meetingId !== meetingKey || !data.fromUserId) return;

      const fromUserId = data.fromUserId;
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          // Drain pending candidates
          const pending = pendingCandidatesRef.current.get(fromUserId) || [];
          for (const cand of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          }
          pendingCandidatesRef.current.delete(fromUserId);
        } catch (err) {
          console.warn('Error applying remote description:', err);
        }
      }
    };

    // 5. When receiving ICE candidate
    const handleIceCandidate = async (data: { fromUserId: string; candidate: any; meetingId: string }) => {
      if (data?.meetingId !== meetingKey || !data.fromUserId) return;

      const fromUserId = data.fromUserId;
      const pc = peerConnectionsRef.current.get(fromUserId);

      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.warn('Error adding ICE candidate:', err);
        }
      } else {
        const queue = pendingCandidatesRef.current.get(fromUserId) || [];
        queue.push(data.candidate);
        pendingCandidatesRef.current.set(fromUserId, queue);
      }
    };

    // 6. When a user leaves
    const handleUserLeft = (data: { userId: string }) => {
      const leftUserId = data?.userId;
      if (!leftUserId) return;

      const pc = peerConnectionsRef.current.get(leftUserId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(leftUserId);
      }

      setRemotePeers((prev) => {
        const copy = new Map(prev);
        copy.delete(leftUserId);
        return copy;
      });

      // Update attendance record with left time
      setRealAttendance((prev) => {
        const copy = new Map(prev);
        const existing = copy.get(leftUserId);
        if (existing) {
          const totalMins = Math.max(1, Math.round(durationSecondsRef.current / 60));
          copy.set(leftUserId, {
            ...existing,
            leftAt: new Date().toLocaleTimeString('vi-VN'),
            totalDurationMinutes: totalMins,
            status: totalMins >= 10 ? 'PRESENT' : totalMins >= 5 ? 'LATE' : 'ABSENT',
          });
        }
        return copy;
      });
    };

    // 7. Interactive Hand Raising
    const handleHandRaised = (data: { userId: string; userName: string }) => {
      setHandsQueue((prev) => {
        if (prev.some((h) => h.userId === data.userId)) return prev;
        return [
          ...prev,
          {
            userId: data.userId,
            userName: data.userName,
            raisedAt: new Date().toLocaleTimeString('vi-VN'),
          },
        ];
      });
    };

    const handleHandLowered = (data: { userId: string }) => {
      setHandsQueue((prev) => prev.filter((h) => h.userId !== data.userId));
      if (data.userId === user?.id) {
        setHasRaisedHand(false);
      }
    };

    // 8. Forced Mute
    const handleForceMuted = () => {
      if (!isHost) {
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
        }
        setIsMicOn(false);
        alert('Chủ tọa đã tắt micro của toàn bộ phòng họp.');
      }
    };

    // 9. Live Poll
    const handleNewPoll = (poll: LivePoll) => {
      setActivePoll(poll);
      setShowPollModal(true);
    };

    // 10. Whiteboard
    const handleWhiteboardStroke = (stroke: any) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx || !stroke) return;

      ctx.beginPath();
      ctx.moveTo(stroke.prevX, stroke.prevY);
      ctx.lineTo(stroke.currX, stroke.currY);
      ctx.strokeStyle = stroke.color || '#6366f1';
      ctx.lineWidth = stroke.width || 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    // Register all socket listeners
    socketService.on('user_joined_meeting', handleUserJoined);
    socketService.on('webrtc_offer', handleWebRTCOffer);
    socketService.on('webrtc_answer', handleWebRTCAnswer);
    socketService.on('webrtc_ice_candidate', handleIceCandidate);
    socketService.on('user_left_meeting', handleUserLeft);
    socketService.on('hand_raised', handleHandRaised);
    socketService.on('hand_lowered', handleHandLowered);
    socketService.on('force_muted_by_host', handleForceMuted);
    socketService.on('new_live_poll', handleNewPoll);
    socketService.on('whiteboard_stroke', handleWhiteboardStroke);

    return () => {
      socketService.emit('leave_meeting', meetingKey);

      socketService.off('user_joined_meeting', handleUserJoined);
      socketService.off('webrtc_offer', handleWebRTCOffer);
      socketService.off('webrtc_answer', handleWebRTCAnswer);
      socketService.off('webrtc_ice_candidate', handleIceCandidate);
      socketService.off('user_left_meeting', handleUserLeft);
      socketService.off('hand_raised', handleHandRaised);
      socketService.off('hand_lowered', handleHandLowered);
      socketService.off('force_muted_by_host', handleForceMuted);
      socketService.off('new_live_poll', handleNewPoll);
      socketService.off('whiteboard_stroke', handleWhiteboardStroke);

      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();
    };
  }, [isJoined, meetingKey, user?.id, isHost]);

  // Load ERP Schedules for Teacher Roll Call
  useEffect(() => {
    if (isHost) {
      academicService
        .getSchedule()
        .then((res: any) => {
          const list = res.data || [];
          setSchedules(list);
          if (list.length > 0) {
            setSelectedScheduleId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isHost]);

  // Hardware toggles
  const handleToggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = next));
    }
  };

  const handleToggleCamera = () => {
    const next = !isCameraOn;
    setIsCameraOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = next));
    }
  };

  // Screen sharing with replaceTrack
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }
      setScreenStream(null);
      setIsScreenSharing(false);

      // Revert video tracks back to webcam
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack).catch(() => {});
        });
      }
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const screenTrack = displayStream.getVideoTracks()[0];
        setScreenStream(displayStream);
        setIsScreenSharing(true);

        // Replace track on all existing peer connections
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack).catch(() => {});
        });

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack) {
            peerConnectionsRef.current.forEach((pc) => {
              const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
              if (sender) sender.replaceTrack(camTrack).catch(() => {});
            });
          }
        };
      } catch (err) {
        console.warn('Screen share cancelled:', err);
        setIsScreenSharing(false);
      }
    }
  };

  // Raise / Lower hand
  const handleToggleRaiseHand = () => {
    if (!hasRaisedHand) {
      setHasRaisedHand(true);
      socketService.emit('raise_hand', {
        meetingId: meetingKey,
        userName: user?.fullName || 'Bạn',
      });
    } else {
      setHasRaisedHand(false);
      socketService.emit('lower_hand', {
        meetingId: meetingKey,
      });
    }
  };

  // Host Mute All
  const handleMuteAll = () => {
    setIsMuteForced(true);
    socketService.emit('mute_all_forced', { meetingId: meetingKey });
    setShowModerationModal(false);
    alert('Đã phát lệnh tắt micro của toàn bộ người tham gia.');
  };

  // Whiteboard drawing
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastDrawPos.current = { x, y };
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currX = e.clientX - rect.left;
    const currY = e.clientY - rect.top;

    ctx.lineTo(currX, currY);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    socketService.emit('whiteboard_draw', {
      meetingId: meetingKey,
      stroke: {
        prevX: lastDrawPos.current.x,
        prevY: lastDrawPos.current.y,
        currX,
        currY,
        color: penColor,
        width: penWidth,
      },
    });

    lastDrawPos.current = { x: currX, y: currY };
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
  };

  // Leave Room
  const handleLeaveRoom = () => {
    socketService.emit('leave_meeting', meetingKey);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    onLeave();
  };

  // Save Recording URL to DB
  const handleSaveRecording = async () => {
    if (!recordingUrl.trim()) return;
    setSavingRecording(true);
    try {
      await teamsService.updateRecordings(meeting.id, [
        {
          title: `Bản ghi buổi học: ${meeting.title}`,
          url: recordingUrl.trim(),
          duration: `${Math.max(1, Math.round(durationSeconds / 60))} phút`,
        },
      ]);
      setSavedRecordingSuccess(true);
      setTimeout(() => setSavedRecordingSuccess(false), 3000);
    } catch (err: any) {
      console.warn('Could not save recording:', err);
    }
    setSavingRecording(false);
  };

  // Save ERP Roll Call to DB
  const handleSaveRollCall = async () => {
    if (!selectedScheduleId) {
      setRollCallError('Vui lòng chọn Buổi học trong lịch ERP');
      return;
    }

    setSavingRollCall(true);
    setRollCallMessage(null);
    setRollCallError(null);

    const validStudentRecords = Array.from(realAttendance.values()).filter(
      (att) => Boolean(att.studentProfileId)
    );

    if (validStudentRecords.length === 0) {
      setRollCallError(
        'Không tìm thấy hồ sơ Sinh viên (Student ID) nào trong danh sách tham gia để đồng bộ điểm danh ERP.'
      );
      setSavingRollCall(false);
      return;
    }

    const attendanceRecords = validStudentRecords.map((att) => ({
      studentId: att.studentProfileId!,
      status: att.status as any,
      note: `Tham gia ${att.totalDurationMinutes} phút trong phiên WebRTC`,
    }));

    try {
      await teacherService.saveRollCall({
        scheduleId: selectedScheduleId,
        date: new Date().toISOString().split('T')[0],
        attendances: attendanceRecords.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          notes: r.note,
        })),
        attendanceRecords,
      });
      setRollCallMessage('Đã đồng bộ kết quả điểm danh vào hệ thống ERP thành công!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu điểm danh vào ERP';
      setRollCallError(msg);
    }
    setSavingRollCall(false);
  };

  const handleVotePoll = (option: string) => {
    setUserVotedOption(option);
    if (!activePoll) return;
    const currentVotes = activePoll.results?.[option] || 0;
    const updatedPoll = {
      ...activePoll,
      results: {
        ...(activePoll.results || {}),
        [option]: currentVotes + 1,
      },
      totalVotes: (activePoll.totalVotes || 0) + 1,
    };
    setActivePoll(updatedPoll);
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollQuestion.trim()) return;
    const opts = newPollOptions.filter((o) => o.trim());
    if (opts.length < 2) return;

    const pollData: LivePoll = {
      id: `poll-${Date.now()}`,
      meetingId: meetingKey,
      question: newPollQuestion.trim(),
      options: opts,
      results: opts.reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {}),
      totalVotes: 0,
      isActive: true,
    };

    socketService.emit('live_poll_started', {
      meetingId: meetingKey,
      poll: pollData,
    });

    setActivePoll(pollData);
    setUserVotedOption(null);
    setShowCreatePollModal(false);
    setShowPollModal(true);
    setNewPollQuestion('');
    setNewPollOptions(['', '', '']);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ============================================================
  // PRE-JOIN SCREEN
  // ============================================================
  if (!isJoined) {
    return (
      <div className="fixed inset-0 z-50 bg-[#111827] text-white flex flex-col items-center justify-center p-6 select-none animate-in fade-in">
        <div className="w-full max-w-xl rounded-3xl bg-[#1f2937] border border-gray-800 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <span className="rounded-full bg-violet-500/20 text-violet-300 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              Kiểm Tra Thiết Bị Trước Khi Vào
            </span>
            <h2 className="text-xl font-bold text-white pt-2">{meeting.title}</h2>
            <p className="text-xs text-gray-400 font-mono">
              Mã phòng: <span className="text-emerald-400 font-bold">{meetingKey}</span>
            </p>
          </div>

          {/* Camera preview */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-gray-700">
            {isCameraOn && localStream ? (
              <video
                ref={prejoinVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500">
                <VideoOff className="h-12 w-12 mb-2 text-gray-600" />
                <span className="text-xs">Camera đang tắt</span>
              </div>
            )}

            {/* Mic Volume Level Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs">
              <Mic className={`h-4 w-4 ${isMicOn && audioVolume > 5 ? 'text-emerald-400 animate-pulse' : 'text-gray-400'}`} />
              <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-75"
                  style={{ width: `${Math.min(100, isMicOn ? audioVolume * 2.5 : 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-300 font-mono w-10 text-right">
                {isMicOn ? `${audioVolume}%` : 'Tắt'}
              </span>
            </div>
          </div>

          {/* Device Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleToggleMic}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition cursor-pointer shadow-md ${
                isMicOn ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              {isMicOn ? <Mic className="h-4 w-4 text-emerald-400" /> : <MicOff className="h-4 w-4" />}
              <span>{isMicOn ? 'Micro Bật' : 'Micro Tắt'}</span>
            </button>

            <button
              onClick={handleToggleCamera}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition cursor-pointer shadow-md ${
                isCameraOn ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              {isCameraOn ? <VideoIcon className="h-4 w-4 text-emerald-400" /> : <VideoOff className="h-4 w-4" />}
              <span>{isCameraOn ? 'Camera Bật' : 'Camera Tắt'}</span>
            </button>
          </div>

          {mediaError && (
            <div className="rounded-xl bg-amber-500/20 border border-amber-500/30 p-3 text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>{mediaError}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onLeave}
              className="rounded-xl border border-gray-700 px-5 py-2.5 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
            >
              Quay Lại
            </button>

            <button
              onClick={() => setIsJoined(true)}
              className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-lg transition cursor-pointer flex items-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Tham Gia Cuộc Họp Ngay</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // LIVE MEETING ROOM
  // ============================================================
  return (
    <div className="fixed inset-0 z-50 bg-[#111827] text-white flex flex-col animate-in fade-in select-none">
      {/* 1. TOP BAR */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800 bg-[#1f2937]/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white leading-tight">{meeting.title}</h3>
              <span className="rounded bg-rose-500/20 text-rose-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                WebRTC Live
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              Phòng: <span className="text-emerald-400">{meetingKey}</span> • Thời gian: {formatTimer(durationSeconds)}
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-3">
          {isMuteForced && (
            <span className="rounded-xl bg-rose-500/20 text-rose-300 px-2.5 py-1 text-xs font-bold border border-rose-500/40">
              Mic Lớp Đã Khóa
            </span>
          )}

          {handsQueue.length > 0 && (
            <button
              onClick={() => setShowHandsModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 text-amber-300 px-3 py-1.5 text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30 transition cursor-pointer"
            >
              <Hand className="h-4 w-4" />
              <span>{handsQueue.length} người giơ tay</span>
            </button>
          )}

          {activePoll && (
            <button
              onClick={() => setShowPollModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600/30 text-violet-300 px-3 py-1.5 text-xs font-bold border border-violet-500/40 hover:bg-violet-600/40 transition cursor-pointer"
            >
              <Vote className="h-4 w-4" />
              <span>Bình Chọn Live</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 rounded-xl bg-gray-800 px-3 py-1.5 text-xs text-gray-300 font-medium">
            <Users className="h-4 w-4 text-gray-400" />
            <span>{1 + remotePeers.size} người trực tuyến</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN VIDEO GALLERY / SCREEN SHARE / WHITEBOARD */}
      <div className="flex-1 overflow-y-auto p-4 relative flex flex-col">
        {isScreenSharing && (
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.3)] mb-4 flex flex-col h-72 md:h-96 shrink-0">
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-xl bg-black/70 backdrop-blur-md px-3 py-1 text-xs text-white">
              <Share2 className="h-4 w-4 text-violet-400" />
              <span className="font-semibold">Màn hình đang chia sẻ của bạn</span>
            </div>
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain bg-black"
            />
          </div>
        )}

        {showWhiteboard ? (
          <div className="flex-1 bg-white rounded-2xl flex flex-col overflow-hidden text-gray-900 shadow-2xl min-h-[400px]">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 bg-gray-50 text-xs">
              <span className="font-bold text-gray-800 flex items-center gap-1.5">
                <PenTool className="h-4 w-4 text-violet-600" /> Bảng Trắng Tương Tác Trực Tuyến
              </span>

              <div className="flex items-center gap-2">
                {['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#000000'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setPenColor(c)}
                    className={`h-5 w-5 rounded-full border-2 transition cursor-pointer ${
                      penColor === c ? 'border-gray-900 scale-125' : 'border-white'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <button
                  onClick={() => setShowWhiteboard(false)}
                  className="rounded-lg bg-gray-200 hover:bg-gray-300 px-2 py-1 text-[11px] font-bold text-gray-700 cursor-pointer"
                >
                  Đóng Bảng
                </button>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={1200}
              height={700}
              onMouseDown={handleStartDraw}
              onMouseMove={handleDraw}
              onMouseUp={handleEndDraw}
              onMouseLeave={handleEndDraw}
              className="flex-1 bg-white cursor-crosshair w-full h-full touch-none"
            />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Local Video Tile */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-900 border-2 border-violet-500 shadow-md flex items-center justify-center min-h-[220px]">
              {isCameraOn && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="h-16 w-16 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center text-xl font-bold mb-2">
                    {user?.fullName?.charAt(0) || 'B'}
                  </div>
                  <span className="text-xs text-gray-400">Camera của bạn đang tắt</span>
                </div>
              )}

              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  Bạn {isHost && '(Chủ tọa)'}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs">
                <span className="font-semibold text-white truncate">
                  {user?.fullName || 'Bạn'}
                </span>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  {isMicOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5 text-rose-500" />}
                </div>
              </div>
            </div>

            {/* Remote Peers */}
            {Array.from(remotePeers.values()).map((peer) => (
              <RemoteVideoTile key={peer.userId} peer={peer} />
            ))}

            {/* Empty peers state */}
            {remotePeers.size === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-800 bg-[#161e2e]/50 p-6 flex flex-col items-center justify-center text-center text-gray-400 min-h-[220px]">
                <Users className="h-8 w-8 text-gray-600 mb-2" />
                <p className="text-xs font-bold text-gray-300">Đang chờ người tham gia khác...</p>
                <p className="text-[11px] text-gray-500 mt-1 max-w-xs">
                  Chia sẻ mã phòng <span className="font-mono text-emerald-400 font-bold">{meetingKey}</span> để mời người khác vào phòng.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BOTTOM CONTROL DOCK */}
      <footer className="h-20 shrink-0 border-t border-gray-800 bg-[#1f2937]/95 px-6 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono hidden sm:inline">
            PreSkool WebRTC • P2P Mesh
          </span>
        </div>

        {/* Center Dock Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleToggleMic}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition cursor-pointer ${
              isMicOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
            title={isMicOn ? 'Tắt Micro' : 'Bật Micro'}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            onClick={handleToggleCamera}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition cursor-pointer ${
              isCameraOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
            title={isCameraOn ? 'Tắt Camera' : 'Bật Camera'}
          >
            {isCameraOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          <button
            onClick={handleToggleScreenShare}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition cursor-pointer ${
              isScreenSharing ? 'bg-violet-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
            title="Chia sẻ màn hình"
          >
            <Share2 className="h-5 w-5" />
          </button>

          <button
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition cursor-pointer ${
              showWhiteboard ? 'bg-violet-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
            title="Bảng trắng tương tác"
          >
            <PenTool className="h-5 w-5" />
          </button>

          <button
            onClick={handleToggleRaiseHand}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition cursor-pointer ${
              hasRaisedHand ? 'bg-amber-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
            title={hasRaisedHand ? 'Hạ tay' : 'Giơ tay phát biểu'}
          >
            <Hand className="h-5 w-5" />
          </button>

          {isHost && (
            <button
              onClick={() => setShowModerationModal(true)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-800 hover:bg-gray-700 text-white transition cursor-pointer"
              title="Quyền điều hành của Host"
            >
              <ShieldAlert className="h-5 w-5 text-amber-400" />
            </button>
          )}

          {/* Leave / End button */}
          {isHost ? (
            <button
              onClick={() => setShowEndMeetingModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 px-5 py-3 text-xs font-bold text-white shadow-lg transition cursor-pointer"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Kết Thúc</span>
            </button>
          ) : (
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 px-5 py-3 text-xs font-bold text-white shadow-lg transition cursor-pointer"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Rời Phòng</span>
            </button>
          )}
        </div>

        <div className="w-24" />
      </footer>

      {/* MODAL: HOST MODERATION */}
      {showModerationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#1f2937] border border-gray-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white">Điều Hành Phòng Họp (Host)</h3>
              <button onClick={() => setShowModerationModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleMuteAll}
                className="w-full flex items-center justify-between rounded-xl bg-gray-800 hover:bg-gray-700 p-3 text-xs font-semibold text-rose-300 transition cursor-pointer"
              >
                <span>Tắt Micro Của Toàn Bộ Phòng Họp</span>
                <MicOff className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setShowModerationModal(false);
                  setShowCreatePollModal(true);
                }}
                className="w-full flex items-center justify-between rounded-xl bg-gray-800 hover:bg-gray-700 p-3 text-xs font-semibold text-violet-300 transition cursor-pointer"
              >
                <span>Tạo Bình Chọn Nhanh (Live Poll)</span>
                <Vote className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DANH SÁCH GIƠ TAY */}
      {showHandsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#1f2937] border border-gray-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Hand className="h-4 w-4 text-amber-400" />
                <span>Danh Sách Người Giơ Tay ({handsQueue.length})</span>
              </h3>
              <button onClick={() => setShowHandsModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {handsQueue.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Hiện không có ai giơ tay.</p>
              ) : (
                handsQueue.map((h) => (
                  <div key={h.userId} className="flex items-center justify-between p-2 rounded-xl bg-gray-800 text-xs">
                    <span className="font-semibold text-white">{h.userName}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{h.raisedAt}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIVE POLL */}
      {showPollModal && activePoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#1f2937] border border-gray-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Vote className="h-4 w-4 text-violet-400" />
                <span>Bình Chọn Trực Tiếp (Live Poll)</span>
              </h3>
              <button onClick={() => setShowPollModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-100 mb-3">{activePoll.question}</p>
              <div className="space-y-2">
                {activePoll.options.map((opt) => {
                  const votes = activePoll.results?.[opt] || 0;
                  const total = activePoll.totalVotes || 1;
                  const percent = Math.round((votes / total) * 100);
                  const isVoted = userVotedOption === opt;

                  return (
                    <button
                      key={opt}
                      onClick={() => handleVotePoll(opt)}
                      disabled={!!userVotedOption}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer relative overflow-hidden ${
                        isVoted
                          ? 'border-violet-500 bg-violet-950/40 text-white font-bold'
                          : 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-750'
                      }`}
                    >
                      <div
                        className="absolute inset-0 bg-violet-500/20"
                        style={{ width: `${percent}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span>{opt}</span>
                        <span className="font-mono text-[11px] text-violet-300">
                          {votes} ({percent}%)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TẠO LIVE POLL MỚI */}
      {showCreatePollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#1f2937] border border-gray-800 p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white">Khởi Tạo Bình Chọn Nhanh</h3>
              <button onClick={() => setShowCreatePollModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreatePollSubmit} className="space-y-3">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Câu hỏi bình chọn *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Các bạn đã hiểu phần WebRTC Mesh chưa?"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 p-2 text-white outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-gray-300 font-semibold block">Các lựa chọn *</label>
                {newPollOptions.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Lựa chọn ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const copy = [...newPollOptions];
                      copy[i] = e.target.value;
                      setNewPollOptions(copy);
                    }}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 p-2 text-white outline-none"
                    required={i < 2}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePollModal(false)}
                  className="rounded-xl border border-gray-700 px-4 py-2 font-semibold text-gray-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-5 py-2 font-bold text-white hover:bg-violet-700"
                >
                  Phát Bình Chọn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KẾT THÚC CUỘC HỌP & ĐIỂM DANH ERP THỰC TẾ */}
      {showEndMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-[#1f2937] border border-gray-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-gray-200">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Tổng Kết Buổi Học & Đồng Bộ Điểm Danh ERP</h3>
                <p className="text-xs text-gray-400">
                  Thời lượng thực tế: {formatTimer(durationSeconds)} ({Math.max(1, Math.round(durationSeconds / 60))} phút)
                </p>
              </div>
              <button onClick={() => setShowEndMeetingModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Real Attendance Table */}
            <div>
              <h4 className="text-xs font-bold text-gray-300 uppercase mb-2">
                Người Tham Gia Thực Tế Trong Phiên ({realAttendance.size}):
              </h4>
              <div className="rounded-2xl border border-gray-800 overflow-hidden bg-gray-900/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-800/70 text-gray-400 text-[11px]">
                    <tr>
                      <th className="p-3">Họ Tên</th>
                      <th className="p-3">Mã SV/GV</th>
                      <th className="p-3">Giờ Vào</th>
                      <th className="p-3">Thời Lượng</th>
                      <th className="p-3">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {Array.from(realAttendance.values()).map((att) => (
                      <tr key={att.userId}>
                        <td className="p-3 font-semibold text-white">{att.fullName}</td>
                        <td className="p-3 font-mono text-gray-400">{att.studentCode || 'N/A'}</td>
                        <td className="p-3 font-mono text-gray-400">{att.joinedAt}</td>
                        <td className="p-3 font-mono text-emerald-400">{att.totalDurationMinutes}m</td>
                        <td className="p-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              att.status === 'PRESENT'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : att.status === 'LATE'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recording URL Save */}
            <div className="space-y-1.5 pt-2 border-t border-gray-800">
              <label className="text-xs font-bold text-gray-300 block">Link Video Ghi Hình (Recording):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-mono text-white outline-none"
                />
                <button
                  onClick={handleSaveRecording}
                  disabled={savingRecording}
                  className="rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
                >
                  {savingRecording ? 'Đang Lưu...' : savedRecordingSuccess ? 'Đã Lưu!' : 'Lưu Vào LMS'}
                </button>
              </div>
            </div>

            {/* ERP Schedule Roll Call */}
            {schedules.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <label className="text-xs font-bold text-gray-300 block">
                  Đồng Bộ Điểm Danh Vào Buổi Học ERP:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-white outline-none"
                  >
                    {schedules.map((sch) => (
                      <option key={sch.id} value={sch.id}>
                        {sch.date} - Ca {sch.shift} (Phòng {sch.room})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSaveRollCall}
                    disabled={savingRollCall}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
                  >
                    {savingRollCall ? 'Đang Lưu...' : 'Lưu Điểm Danh ERP'}
                  </button>
                </div>

                {rollCallMessage && (
                  <p className="text-xs text-emerald-400 font-semibold">{rollCallMessage}</p>
                )}
                {rollCallError && (
                  <p className="text-xs text-rose-400 font-semibold">{rollCallError}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
              <button
                onClick={() => setShowEndMeetingModal(false)}
                className="rounded-xl border border-gray-700 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleLeaveRoom}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-bold text-white"
              >
                Xác Nhận Kết Thúc & Rời Phòng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsMeetingRoom;
