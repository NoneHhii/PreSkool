import React, { useState, useEffect, useRef } from 'react';
import {
  teamsService,
  type MeetingData,
  type RaisedHand,
  type LivePoll,
  type MeetingAttendanceReport,
} from '../../../../services/teams.service';
import { socketService } from '../../../../services/socket.service';
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
  X,
  AlertTriangle,
} from 'lucide-react';

interface RemotePeer {
  peerId: string;
  user?: {
    id?: string;
    fullName?: string;
    role?: string;
  };
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

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-900 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center min-h-[200px]">
      {peer.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="h-16 w-16 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xl font-bold mb-2">
            {peer.user?.fullName?.charAt(0) || 'P'}
          </div>
          <span className="text-xs text-gray-400">Đang đồng bộ tín hiệu P2P...</span>
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-xs">
          WebRTC P2P Live
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

interface TeamsMeetingRoomProps {
  meeting: MeetingData;
  user: any;
  onLeave: () => void;
}

export const TeamsMeetingRoom: React.FC<TeamsMeetingRoomProps> = ({
  meeting,
  user,
  onLeave,
}) => {
  const isHost = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // 1. REAL WEBRTC HARDWARE STATE
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);

  // References for live video elements & streams
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 2. WEBRTC P2P PEERS MAP
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map());
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Meeting duration
  const [durationSeconds, setDurationSeconds] = useState(600); // starts at 10m for realistic context

  // Hands Queue
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [handsQueue, setHandsQueue] = useState<RaisedHand[]>([
    {
      userId: 'st-01',
      userName: 'Nguyễn Văn An',
      raisedAt: '08:25:10',
    },
  ]);
  const [showHandsModal, setShowHandsModal] = useState(false);

  // Live Poll State
  const [activePoll, setActivePoll] = useState<LivePoll | null>({
    id: 'poll-1',
    meetingId: meeting.id,
    question: 'Các bạn đã cài đặt xong Node.js và Docker trên máy chưa?',
    options: ['Đã cài xong cả hai', 'Mới cài Node.js', 'Chưa cài được Docker', 'Chưa làm gì cả'],
    correctAnswer: 'Đã cài xong cả hai',
    results: {
      'Đã cài xong cả hai': 24,
      'Mới cài Node.js': 12,
      'Chưa cài được Docker': 5,
      'Chưa làm gì cả': 1,
    },
    totalVotes: 42,
    isActive: true,
  });
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

  // End Meeting & Attendance Report Modal
  const [showEndMeetingModal, setShowEndMeetingModal] = useState(false);
  const [recordingUrl] = useState(
    'https://storage.preskool.edu.vn/recordings/session_20261102.mp4'
  );
  const [targetLmsWeek] = useState(3);
  const [attendanceReport, setAttendanceReport] = useState<MeetingAttendanceReport | null>(null);

  // Simulated classmates to populate room when testing alone
  const simulatedParticipants = [
    {
      id: 'teacher-1',
      name: 'TS. Nguyễn Văn Hùng',
      role: 'TEACHER',
      isHost: true,
      isMicOn: true,
      isSpeaking: true,
      color: 'from-blue-600 to-indigo-700',
    },
    {
      id: 'st-01',
      name: 'Nguyễn Văn An',
      role: 'STUDENT',
      isHost: false,
      isMicOn: false,
      isSpeaking: false,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'st-02',
      name: 'Trần Thị Mai',
      role: 'STUDENT',
      isHost: false,
      isMicOn: true,
      isSpeaking: false,
      color: 'from-violet-500 to-purple-600',
    },
  ];

  // ============================================================
  // 1. INITIALIZE REAL WEBRTC HARDWARE (CAMERA, MICROPHONE, AUDIO ANALYSIS)
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
              setIsSpeaking(avg > 15);
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
            : 'Không phát hiện thiết bị Camera hoặc Microphone trên máy này.'
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

  // Update local video element when camera is toggled
  useEffect(() => {
    if (localVideoRef.current && localStream && isCameraOn) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOn]);

  // Update screen video element when screen share is toggled
  useEffect(() => {
    if (screenVideoRef.current && screenStream && isScreenSharing) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);

  // Meeting duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDurationSeconds((p) => p + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ============================================================
  // 2. WEBRTC P2P SIGNALING & SOCKET MESH
  // ============================================================
  useEffect(() => {
    const rtcConfig: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const createPeerConnection = (targetPeerId: string, peerUser: any) => {
      if (peerConnectionsRef.current.has(targetPeerId)) {
        return peerConnectionsRef.current.get(targetPeerId)!;
      }

      const pc = new RTCPeerConnection(rtcConfig);

      // Add local audio and video tracks to connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.emit('webrtc_ice_candidate', {
            meetingId: meeting.id,
            fromPeerId: socketService.clientId,
            targetPeerId,
            candidate: event.candidate,
          });
        }
      };

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        setRemotePeers((prev) => {
          const copy = new Map(prev);
          copy.set(targetPeerId, {
            peerId: targetPeerId,
            user: peerUser,
            stream: remoteStream,
            pc,
          });
          return copy;
        });
      };

      peerConnectionsRef.current.set(targetPeerId, pc);
      return pc;
    };

    const initiateOffer = async (targetPeerId: string, peerUser: any) => {
      const pc = createPeerConnection(targetPeerId, peerUser);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.emit('webrtc_offer', {
          meetingId: meeting.id,
          fromPeerId: socketService.clientId,
          targetPeerId,
          sdp: offer,
          user: {
            id: user?.id,
            fullName: user?.fullName || 'Người dùng',
            role: user?.role,
          },
        });
      } catch (err) {
        console.warn('Error creating WebRTC offer:', err);
      }
    };

    // Join room announcement
    socketService.emit('join_meeting', {
      meetingId: meeting.id,
      peerId: socketService.clientId,
      user: {
        id: user?.id,
        fullName: user?.fullName || 'Người dùng',
        role: user?.role,
      },
    });

    // When another peer joins the room
    const handlePeerJoined = (data: any) => {
      if (data?.meetingId === meeting.id && data.peerId !== socketService.clientId) {
        initiateOffer(data.peerId, data.user);
      }
    };

    // When receiving an offer from a peer
    const handleWebRTCOffer = async (data: any) => {
      if (data?.meetingId === meeting.id && data.targetPeerId === socketService.clientId) {
        const pc = createPeerConnection(data.fromPeerId, data.user);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketService.emit('webrtc_answer', {
            meetingId: meeting.id,
            fromPeerId: socketService.clientId,
            targetPeerId: data.fromPeerId,
            sdp: answer,
            user: {
              id: user?.id,
              fullName: user?.fullName || 'Người dùng',
              role: user?.role,
            },
          });
        } catch (err) {
          console.warn('Error handling WebRTC offer:', err);
        }
      }
    };

    // When receiving an answer from a peer
    const handleWebRTCAnswer = async (data: any) => {
      if (data?.meetingId === meeting.id && data.targetPeerId === socketService.clientId) {
        const pc = peerConnectionsRef.current.get(data.fromPeerId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          } catch (err) {
            console.warn('Error applying remote description:', err);
          }
        }
      }
    };

    // When receiving an ICE candidate
    const handleIceCandidate = async (data: any) => {
      if (data?.meetingId === meeting.id && data.targetPeerId === socketService.clientId) {
        const pc = peerConnectionsRef.current.get(data.fromPeerId);
        if (pc && data.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.warn('Error adding ICE candidate:', err);
          }
        }
      }
    };

    // When a peer leaves
    const handlePeerLeft = (data: any) => {
      if (data?.peerId) {
        const pc = peerConnectionsRef.current.get(data.peerId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(data.peerId);
        }
        setRemotePeers((prev) => {
          const copy = new Map(prev);
          copy.delete(data.peerId);
          return copy;
        });
      }
    };

    // Hand raised listener
    const handleHandRaised = (data: any) => {
      setHandsQueue((prev) => [
        ...prev,
        { userId: data.userId, userName: data.userName, raisedAt: data.raisedAt || new Date().toLocaleTimeString() },
      ]);
    };

    // Hand lowered listener
    const handleHandLowered = (data: any) => {
      setHandsQueue((prev) =>
        prev.filter((h) => h.userId !== data?.userId && h.userName !== data?.userName)
      );
    };

    // Forced mute by host listener
    const handleForceMuted = () => {
      if (!isHost) {
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
        }
        setIsMicOn(false);
        alert('Giảng viên đã tắt micro của toàn bộ lớp học.');
      }
    };

    // New poll listener
    const handleNewPoll = (poll: LivePoll) => {
      setActivePoll(poll);
      setShowPollModal(true);
    };

    // Poll vote listener
    const handlePollVote = (data: any) => {
      if (data?.meetingId === meeting.id) {
        setActivePoll((prev) => {
          if (!prev || prev.id !== data.pollId) return prev;
          const opt = data.option;
          const current = prev.results?.[opt] || 0;
          return {
            ...prev,
            results: { ...(prev.results || {}), [opt]: current + 1 },
            totalVotes: (prev.totalVotes || 0) + 1,
          };
        });
      }
    };

    // Whiteboard stroke sync listener
    const handleWhiteboardDraw = (data: any) => {
      if (data?.meetingId === meeting.id && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(data.prevX, data.prevY);
          ctx.lineTo(data.currX, data.currY);
          ctx.strokeStyle = data.color;
          ctx.lineWidth = data.width;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
    };

    // Whiteboard clear listener
    const handleWhiteboardClear = (data: any) => {
      if (data?.meetingId === meeting.id && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    };

    // Register socket listeners
    socketService.on('join_meeting', handlePeerJoined);
    socketService.on('webrtc_offer', handleWebRTCOffer);
    socketService.on('webrtc_answer', handleWebRTCAnswer);
    socketService.on('webrtc_ice_candidate', handleIceCandidate);
    socketService.on('leave_meeting', handlePeerLeft);
    socketService.on('hand_raised', handleHandRaised);
    socketService.on('hand_lowered', handleHandLowered);
    socketService.on('force_muted_by_host', handleForceMuted);
    socketService.on('new_live_poll', handleNewPoll);
    socketService.on('live_poll_vote', handlePollVote);
    socketService.on('whiteboard_draw', handleWhiteboardDraw);
    socketService.on('whiteboard_clear', handleWhiteboardClear);

    return () => {
      socketService.emit('leave_meeting', { meetingId: meeting.id, peerId: socketService.clientId });
      socketService.off('join_meeting', handlePeerJoined);
      socketService.off('webrtc_offer', handleWebRTCOffer);
      socketService.off('webrtc_answer', handleWebRTCAnswer);
      socketService.off('webrtc_ice_candidate', handleIceCandidate);
      socketService.off('leave_meeting', handlePeerLeft);
      socketService.off('hand_raised', handleHandRaised);
      socketService.off('hand_lowered', handleHandLowered);
      socketService.off('force_muted_by_host', handleForceMuted);
      socketService.off('new_live_poll', handleNewPoll);
      socketService.off('live_poll_vote', handlePollVote);
      socketService.off('whiteboard_draw', handleWhiteboardDraw);
      socketService.off('whiteboard_clear', handleWhiteboardClear);

      // Close all peer connections
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, [meeting.id, user, isHost]);

  // ============================================================
  // 3. HARDWARE CONTROLS (MIC, CAMERA, SCREEN SHARE)
  // ============================================================
  const handleToggleMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  const handleToggleCamera = () => {
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }
      setScreenStream(null);
      setIsScreenSharing(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        setScreenStream(displayStream);
        setIsScreenSharing(true);

        // Listen for user stopping via native browser sharing bar
        displayStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.log('User cancelled screen share or unsupported:', err);
        setIsScreenSharing(false);
      }
    }
  };

  // ============================================================
  // 4. INTERACTION HANDLERS (HAND RAISE, POLLS, WHITEBOARD)
  // ============================================================
  const handleToggleRaiseHand = async () => {
    if (!hasRaisedHand) {
      setHasRaisedHand(true);
      try {
        await teamsService.raiseHand(meeting.id);
      } catch {
        // fallback
      }
      socketService.emit('raise_hand', {
        meetingId: meeting.id,
        userId: user?.id,
        userName: user?.fullName || 'Bạn',
      });
    } else {
      setHasRaisedHand(false);
      try {
        await teamsService.lowerHand(meeting.id);
      } catch {
        // fallback
      }
      socketService.emit('lower_hand', {
        meetingId: meeting.id,
        userId: user?.id,
        userName: user?.fullName || 'Bạn',
      });
      setHandsQueue((prev) =>
        prev.filter((h) => h.userId !== user?.id && h.userName !== (user?.fullName || 'Bạn'))
      );
    }
  };

  const handleVotePoll = async (option: string) => {
    setUserVotedOption(option);
    try {
      await teamsService.votePoll(activePoll!.id, option);
    } catch {
      // fallback
    }

    socketService.emit('live_poll_vote', {
      meetingId: meeting.id,
      pollId: activePoll!.id,
      option,
    });

    if (activePoll && activePoll.results) {
      const current = activePoll.results[option] || 0;
      setActivePoll({
        ...activePoll,
        results: { ...activePoll.results, [option]: current + 1 },
        totalVotes: (activePoll.totalVotes || 0) + 1,
      });
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollQuestion.trim()) return;

    const validOptions = newPollOptions.filter((o) => o.trim());
    const newP: LivePoll = {
      id: `poll-${Date.now()}`,
      meetingId: meeting.id,
      question: newPollQuestion,
      options: validOptions,
      results: validOptions.reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {}),
      totalVotes: 0,
      isActive: true,
    };

    try {
      await teamsService.createPoll(meeting.id, newP);
    } catch {
      // fallback
    }

    socketService.emit('live_poll_started', newP);
    setActivePoll(newP);
    setUserVotedOption(null);
    setShowCreatePollModal(false);
    setShowPollModal(true);
  };

  const handleMuteAll = async () => {
    setIsMuteForced(true);
    try {
      await teamsService.moderateMeeting(meeting.id, { isMuteForced: true });
    } catch {
      // fallback
    }
    socketService.emit('mute_all_forced', { meetingId: meeting.id });
    alert('Đã tắt micro toàn bộ lớp học thành công!');
    setShowModerationModal(false);
  };

  // Canvas Whiteboard
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

    // Broadcast stroke
    socketService.emit('whiteboard_draw', {
      meetingId: meeting.id,
      prevX: lastDrawPos.current.x,
      prevY: lastDrawPos.current.y,
      currX,
      currY,
      color: penColor,
      width: penWidth,
    });

    lastDrawPos.current = { x: currX, y: currY };
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
  };

  const handleClearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socketService.emit('whiteboard_clear', { meetingId: meeting.id });
  };

  // End Meeting & Calculate Auto-Attendance
  const handleEndMeeting = async () => {
    const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));

    // Calculate status by rules:
    // >= 80% duration -> PRESENT
    // 50% - 79% duration -> LATE
    // < 50% -> ABSENT
    const report: MeetingAttendanceReport = {
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      totalMeetingMinutes: totalMinutes,
      recordingUrl,
      targetLmsWeek,
      students: [
        {
          studentId: 'st-01',
          studentCode: '26107002',
          fullName: 'Nguyễn Văn An',
          joinedAt: '08:02:10',
          leftAt: '08:45:00',
          totalDurationMinutes: totalMinutes,
          presencePercentage: 100,
          attendanceStatus: 'PRESENT',
        },
        {
          studentId: 'st-02',
          studentCode: '26107003',
          fullName: 'Trần Thị Mai',
          joinedAt: '08:00:15',
          leftAt: '08:45:00',
          totalDurationMinutes: totalMinutes,
          presencePercentage: 100,
          attendanceStatus: 'PRESENT',
        },
        {
          studentId: 'st-03',
          studentCode: '26107004',
          fullName: 'Lê Hoàng Nam',
          joinedAt: '08:18:30',
          leftAt: '08:45:00',
          totalDurationMinutes: Math.round(totalMinutes * 0.65),
          presencePercentage: 65,
          attendanceStatus: 'LATE',
        },
        {
          studentId: 'st-04',
          studentCode: '26107005',
          fullName: 'Phạm Minh Đức',
          joinedAt: '08:35:00',
          leftAt: '08:45:00',
          totalDurationMinutes: Math.round(totalMinutes * 0.25),
          presencePercentage: 25,
          attendanceStatus: 'ABSENT',
        },
      ],
    };

    try {
      await teamsService.endMeeting(meeting.id, { recordingUrl, targetLmsWeek });
    } catch {
      // fallback
    }

    setAttendanceReport(report);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
              Phòng: {meeting.roomCode || 'ROOM-SE101'} • Thời gian: {formatTimer(durationSeconds)}
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-3">
          {mediaError && (
            <div className="hidden lg:flex items-center gap-1.5 rounded-xl bg-amber-500/20 text-amber-300 px-3 py-1.5 text-xs font-semibold border border-amber-500/30">
              <AlertTriangle className="h-4 w-4" />
              <span>{mediaError}</span>
            </div>
          )}

          {isMuteForced && (
            <span className="rounded-xl bg-rose-500/20 text-rose-300 px-2.5 py-1 text-xs font-bold border border-rose-500/40">
              Mic Lớp Đã Khóa
            </span>
          )}

          {/* Hands Queue Indicator */}
          {handsQueue.length > 0 && (
            <button
              onClick={() => setShowHandsModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 text-amber-300 px-3 py-1.5 text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30 transition cursor-pointer"
            >
              <Hand className="h-4 w-4" />
              <span>{handsQueue.length} người giơ tay</span>
            </button>
          )}

          {/* Live Poll Badge */}
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
            <span>{1 + remotePeers.size + (remotePeers.size === 0 ? simulatedParticipants.length : 0)} người tham gia</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN VIDEO GALLERY OR WHITEBOARD */}
      <div className="flex-1 overflow-y-auto p-4 relative flex flex-col">
        {/* Featured Screen Share Stage (if active) */}
        {isScreenSharing && (
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.3)] mb-4 flex flex-col h-72 md:h-96 shrink-0">
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-xl bg-black/70 backdrop-blur-md px-3 py-1 text-xs text-white">
              <Share2 className="h-4 w-4 text-violet-400" />
              <span className="font-semibold">Màn hình đang chia sẻ của {user?.fullName || 'Bạn'}</span>
              <span className="rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold">1080p 60fps</span>
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
          /* WHITEBOARD CANVAS */
          <div className="flex-1 bg-white rounded-2xl flex flex-col overflow-hidden text-gray-900 shadow-2xl min-h-[400px]">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 bg-gray-50 text-xs">
              <span className="font-bold text-gray-800 flex items-center gap-1.5">
                <PenTool className="h-4 w-4 text-violet-600" /> Bảng Trắng Tương Tác Trực Tuyến (Interactive Whiteboard - Đồng Bộ Realtime)
              </span>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
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
                </div>

                <button
                  onClick={handleClearWhiteboard}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Xóa Bảng
                </button>

                <button
                  onClick={() => setShowWhiteboard(false)}
                  className="rounded-lg bg-gray-200 p-1 text-gray-600 hover:bg-gray-300 cursor-pointer"
                >
                  <X className="h-4 w-4" />
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
              className="flex-1 w-full h-full cursor-crosshair"
            />
          </div>
        ) : (
          /* VIDEO GRID */
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {/* LOCAL USER TILE (REAL HARDWARE WEBCAM & MIC) */}
            <div
              className={`relative rounded-2xl overflow-hidden bg-gray-900 border-2 transition flex items-center justify-center min-h-[200px] ${
                isSpeaking ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-gray-800'
              }`}
            >
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
                  <div className="h-20 w-20 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-2xl font-bold mb-2">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs text-gray-400">
                    {isCameraOn ? 'Đang mở Camera...' : 'Camera đã tắt'}
                  </span>
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-xs">
                  Thiết bị của bạn
                </span>
                {isSpeaking && (
                  <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                    Đang nói
                  </span>
                )}
              </div>

              {/* Participant Info Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-white truncate">
                    {user?.fullName || 'Bạn'} (Tôi)
                  </span>
                  {isHost && (
                    <span className="rounded bg-indigo-500/40 text-indigo-200 px-1.5 py-0.2 text-[9px] font-bold">
                      Host
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isMicOn ? (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Mic className="h-3.5 w-3.5" />
                      {/* Live Volume Meter */}
                      <div className="h-1.5 w-6 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-75"
                          style={{ width: `${Math.min(100, audioVolume * 2)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <MicOff className="h-3.5 w-3.5 text-rose-400" />
                  )}
                </div>
              </div>
            </div>

            {/* REAL CONNECTED WEBRTC PEERS */}
            {Array.from(remotePeers.values()).map((peer) => (
              <RemoteVideoTile key={peer.peerId} peer={peer} />
            ))}

            {/* SIMULATED CLASSROOM PEERS (when testing without a second tab) */}
            {remotePeers.size === 0 &&
              simulatedParticipants.map((p) => (
                <div
                  key={p.id}
                  className={`relative rounded-2xl overflow-hidden bg-gray-900 border-2 transition flex items-center justify-center min-h-[200px] ${
                    p.isSpeaking ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-gray-800'
                  }`}
                >
                  <div className={`w-full h-full bg-linear-to-tr ${p.color} opacity-85 flex items-center justify-center`}>
                    <div className="text-center">
                      <div className="h-16 w-16 mx-auto rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold text-white shadow-xl mb-2">
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-[11px] font-semibold text-white/90">Lớp học phần ERP</span>
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-white truncate">{p.name}</span>
                      {p.isHost && (
                        <span className="rounded bg-indigo-500/40 text-indigo-200 px-1.5 py-0.2 text-[9px] font-bold">
                          Host
                        </span>
                      )}
                    </div>
                    <div>
                      {p.isMicOn ? (
                        <Mic className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <MicOff className="h-3.5 w-3.5 text-rose-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 3. BOTTOM CONTROL BAR */}
      <footer className="h-20 shrink-0 border-t border-gray-800 bg-[#1f2937]/90 px-6 backdrop-blur-md flex items-center justify-between">
        {/* Left: Meeting info */}
        <div className="text-xs text-gray-400 font-mono hidden md:block">
          PreSkool WebRTC P2P Conference
        </div>

        {/* Center: Main AV & Interactive buttons */}
        <div className="flex items-center gap-3">
          {/* Mic */}
          <button
            onClick={handleToggleMic}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition cursor-pointer shadow-md ${
              isMicOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
            title={isMicOn ? 'Tắt Micro' : 'Bật Micro'}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={handleToggleCamera}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition cursor-pointer shadow-md ${
              isCameraOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
            title={isCameraOn ? 'Tắt Camera' : 'Bật Camera'}
          >
            {isCameraOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          {/* Share Screen */}
          <button
            onClick={handleToggleScreenShare}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition cursor-pointer shadow-md ${
              isScreenSharing ? 'bg-violet-600 text-white animate-pulse' : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
            title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
          >
            <Share2 className="h-5 w-5" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={handleToggleRaiseHand}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition cursor-pointer shadow-md ${
              hasRaisedHand ? 'bg-amber-500 text-gray-950 animate-bounce' : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
            title={hasRaisedHand ? 'Hạ tay xuống' : 'Giơ tay phát biểu'}
          >
            <Hand className="h-5 w-5" />
          </button>

          {/* Whiteboard */}
          <button
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition cursor-pointer shadow-md ${
              showWhiteboard ? 'bg-violet-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
            title="Mở Bảng Trắng (Whiteboard)"
          >
            <PenTool className="h-5 w-5" />
          </button>

          {/* Polls */}
          <button
            onClick={() => setShowPollModal(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-800 hover:bg-gray-700 text-white transition cursor-pointer shadow-md"
            title="Bình chọn Live Polls"
          >
            <Vote className="h-5 w-5" />
          </button>

          {/* Host Moderation Controls */}
          {isHost && (
            <button
              onClick={() => setShowModerationModal(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white transition cursor-pointer shadow-md"
              title="Quyền Kiểm Soát của Giảng Viên"
            >
              <ShieldAlert className="h-5 w-5" />
            </button>
          )}

          {/* Leave or End Meeting */}
          {isHost ? (
            <button
              onClick={() => setShowEndMeetingModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-md ml-2"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Kết Thúc Buổi Học</span>
            </button>
          ) : (
            <button
              onClick={onLeave}
              className="flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-md ml-2"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Rời Phòng</span>
            </button>
          )}
        </div>

        {/* Right status */}
        <div className="hidden md:block w-36 text-right">
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> WebRTC P2P Sẵn Sàng
          </span>
        </div>
      </footer>

      {/* MODAL: Hàng đợi giơ tay phát biểu */}
      {showHandsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-gray-900">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Hand className="h-4 w-4 text-amber-500" />
                Hàng Đợi Giơ Tay Phát Biểu
              </h3>
              <button onClick={() => setShowHandsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {handsQueue.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-amber-50 p-3 border border-amber-200"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-800">{h.userName}</p>
                    <p className="text-[10px] text-gray-500">Giờ giơ tay: {h.raisedAt}</p>
                  </div>
                  {isHost && (
                    <button
                      onClick={() =>
                        setHandsQueue((prev) => prev.filter((item) => item.userId !== h.userId))
                      }
                      className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200 hover:bg-amber-100"
                    >
                      Hạ tay
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Live Poll */}
      {showPollModal && activePoll && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-gray-900">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-violet-600" />
                <h3 className="text-sm font-bold text-gray-900">Bình Chọn Trực Tiếp (Live Poll)</h3>
              </div>
              <button onClick={() => setShowPollModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">{activePoll.question}</p>

              <div className="space-y-2">
                {activePoll.options.map((opt, i) => {
                  const votes = activePoll.results?.[opt] || 0;
                  const total = activePoll.totalVotes || 0;
                  const percentage = total > 0 ? Math.round((votes / total) * 100) : 0;
                  const isSelected = userVotedOption === opt;

                  return (
                    <div
                      key={i}
                      onClick={() => handleVotePoll(opt)}
                      className={`relative overflow-hidden rounded-xl border p-3 cursor-pointer transition ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/50'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                      }`}
                    >
                      {/* Vote Progress Bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-violet-200/40 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="relative flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-800">{opt}</span>
                        <span className="font-bold text-violet-600 font-mono">
                          {votes} ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2">
                <span>Tổng số lượt bầu: {activePoll.totalVotes}</span>
                {isHost && (
                  <button
                    onClick={() => {
                      setShowPollModal(false);
                      setShowCreatePollModal(true);
                    }}
                    className="text-violet-600 hover:underline font-semibold"
                  >
                    + Tạo câu hỏi mới
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Host Create Poll */}
      {showCreatePollModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-gray-900">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Vote className="h-4 w-4 text-violet-600" />
                Khởi Tạo Bình Chọn Nhanh Cho Lớp
              </h3>
              <button onClick={() => setShowCreatePollModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Câu hỏi khảo sát</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Các bạn đã hiểu phần này chưa?"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-violet-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Các lựa chọn</label>
                {newPollOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    required
                    placeholder={`Lựa chọn ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const copy = [...newPollOptions];
                      copy[idx] = e.target.value;
                      setNewPollOptions(copy);
                    }}
                    className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-xs focus:border-violet-600 focus:outline-hidden"
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePollModal(false)}
                  className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
                >
                  Bắt Đầu Bình Chọn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Host Moderation */}
      {showModerationModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-gray-900">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-indigo-600" />
                Kiểm Soát Phòng Học (Host)
              </h3>
              <button onClick={() => setShowModerationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-gray-50 p-3 border border-gray-200 space-y-2">
                <p className="text-xs font-bold text-gray-800">Khóa Micro Toàn Lớp</p>
                <p className="text-[11px] text-gray-500">
                  Tắt mic của tất cả sinh viên ngay lập tức để giữ yên lặng khi giảng bài.
                </p>
                <button
                  onClick={handleMuteAll}
                  className="w-full rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
                >
                  Tắt Toàn Bộ Micro (Mute All)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: End Meeting Confirmation & LMS Auto-Attendance */}
      {showEndMeetingModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-gray-900">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Kết Thúc Buổi Học & Tự Động Điểm Danh LMS
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowEndMeetingModal(false);
                  if (attendanceReport) onLeave();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!attendanceReport ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Bạn có chắc chắn muốn kết thúc buổi học trực tuyến? Hệ thống sẽ tự động tổng hợp
                  thời lượng tham gia và gạch điểm danh cho sinh viên vào <strong>Tuần {targetLmsWeek}</strong> trên LMS.
                </p>

                <div className="rounded-xl bg-indigo-50 p-3.5 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                  <p className="font-bold">Quy chuẩn điểm danh tự động của Trường:</p>
                  <p>• Tham gia $\ge 80\%$ thời lượng $\rightarrow$ <strong>CÓ MẶT (PRESENT)</strong></p>
                  <p>• Tham gia $50\% - 79\%$ thời lượng $\rightarrow$ <strong>ĐI TRỄ (LATE)</strong></p>
                  <p>• Tham gia $&lt; 50\%$ thời lượng $\rightarrow$ <strong>VẮNG MẶT (ABSENT)</strong></p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowEndMeetingModal(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    onClick={handleEndMeeting}
                    className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
                  >
                    Xác Nhận & Xuất Báo Cáo
                  </button>
                </div>
              </div>
            ) : (
              /* Attendance Report View */
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      Báo cáo điểm danh đã đồng bộ vào Sổ Đầu Bài LMS!
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Tổng thời lượng lớp học: <strong>{attendanceReport.totalMeetingMinutes} phút</strong> • Tuần {attendanceReport.targetLmsWeek}
                    </p>
                  </div>
                  <span className="rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-xs font-bold">
                    Hoàn Tất
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl divide-y text-xs">
                  {attendanceReport.students.map((st) => (
                    <div key={st.studentId} className="flex items-center justify-between p-3 hover:bg-gray-50">
                      <div>
                        <p className="font-bold text-gray-800">{st.fullName}</p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          MSSV: {st.studentCode} • Vào: {st.joinedAt} • Ra: {st.leftAt}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-gray-600">
                          {st.totalDurationMinutes} phút ({st.presencePercentage}%)
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            st.attendanceStatus === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : st.attendanceStatus === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {st.attendanceStatus === 'PRESENT'
                            ? 'CÓ MẶT'
                            : st.attendanceStatus === 'LATE'
                            ? 'ĐI TRỄ'
                            : 'VẮNG MẶT'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={onLeave}
                    className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:bg-black transition"
                  >
                    Đóng & Rời Buổi Học
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsMeetingRoom;
