import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize, Minimize, X } from 'lucide-react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';

const CallWindow = () => {
  const { user } = useAuthStore();
  const { 
    socket, 
    call, 
    callAccepted, 
    callEnded, 
    stream, 
    setStream, 
    setCall, 
    setCallAccepted, 
    setCallEnded 
  } = useChatStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [calling, setCalling] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    // Only run if there's a call in progress or incoming
    if (call.isReceivingCall || calling) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((currentStream) => {
          setStream(currentStream);
          if (myVideo.current) {
            myVideo.current.srcObject = currentStream;
          }
        })
        .catch(err => console.error("Media error:", err));
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [call.isReceivingCall, calling]);

  useEffect(() => {
    // If we are initiating a call (not receiving one)
    if (call.from && !call.isReceivingCall && !callAccepted && !calling) {
      callUser(call.from, call.name, call.avatar, call.type);
    }
  }, [call]);

  // Handle incoming call listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('call-accepted', (signal) => {
      setCallAccepted(true);
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      }
    });

    socket.on('call-ended', () => {
      leaveCall();
    });

    return () => {
      socket.off('call-accepted');
      socket.off('call-ended');
    };
  }, [socket]);

  const answerCall = () => {
    setCallAccepted(true);
    setCalling(false);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data) => {
      socket.emit('answer-call', { signal: data, to: call.from });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
  };

  const callUser = (id, name, avatar, type = 'video') => {
    setCalling(true);
    
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data) => {
      socket.emit('call-user', {
        userToCall: id,
        signalData: data,
        from: user._id,
        name: user.name,
        avatar: user.avatar,
        type
      });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Reset state
    setCall({ isReceivingCall: false, from: null, name: null, avatar: null, signal: null, type: 'video' });
    setCallAccepted(false);
    setCallEnded(false);
    setStream(null);
    setCalling(false);

    window.location.reload(); // Hard reset for WebRTC cleanup
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  if (!call.isReceivingCall && !calling && !callAccepted) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
      
      {/* Remote Video (Main) */}
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {callAccepted && !callEnded ? (
          <video playsInline ref={userVideo} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <img src={call.avatar || (calling ? 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' : '')} style={{ width: '150px', height: '150px', borderRadius: '50%', marginBottom: '1.5rem', border: '4px solid var(--accent-primary)', padding: '4px' }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{call.name || 'Calling...'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>{call.isReceivingCall ? 'Incoming Video Call...' : 'Ringing...'}</p>
          </div>
        )}

        {/* Local Video (PIP) */}
        <div style={{ position: 'absolute', top: '2rem', right: '2rem', width: '240px', height: '140px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', boxShadow: 'var(--shadow-lg)', background: '#000' }}>
           <video playsInline muted ref={myVideo} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Controls Overlay */}
        <div style={{ position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(30, 41, 59, 0.8)', padding: '1.25rem 2.5rem', borderRadius: '40px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={toggleMute}
            style={{ width: '50px', height: '50px', borderRadius: '50%', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button 
            onClick={toggleVideo}
            style={{ width: '50px', height: '50px', borderRadius: '50%', background: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          {call.isReceivingCall && !callAccepted ? (
            <button 
              onClick={answerCall}
              style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#22c55e', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }}
            >
              <Phone size={30} />
            </button>
          ) : null}

          <button 
            onClick={leaveCall}
            style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }}
          >
            <PhoneOff size={30} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallWindow;
