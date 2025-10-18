import {
  SocketMessageRequest,
  SocketMessageResponse,
} from "@/definitions/thread";
import { useCallback, useEffect, useRef, useState } from "react";

const useSocket = (name: string) => {
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(0);
  const [isConnecting, setConnecting] = useState<boolean>(false);
  const [message, setMessage] = useState<SocketMessageResponse | null>(null);
  const [isConnected, setConnected] = useState<boolean>(false);

  const messageBuffer = useRef<SocketMessageRequest[]>([]);

  const handleMessage = (_message: SocketMessageResponse) => {
    setMessage(_message);
  };

  useEffect(() => {
    let mounted = true;
    if (socketUrl && socket === null) {
      console.log(`[${name}] Attempting Connection in`, timeoutSeconds);
      setTimeout(() => {
        console.log(`[${name}] Creating Connection...`);
        setConnecting(true);
        const _socket = new WebSocket(socketUrl);
        _socket.onmessage = function (e) {
          const data = JSON.parse(e.data);
          if (Array.isArray(data)) {
            data.forEach((d, i) => {
              setTimeout(() => {
                handleMessage(d);
              }, i * 500);
              // console.log(`[${name}] Message received.`, d);
            });
          } else {
            handleMessage(data);
            // console.log(`[${name}] Message received.`, data);
          }
        };
        _socket.onclose = (e) => {
          console.log(`[${name}] Socket closed due to onClose.`, e.code);
          setConnected(false);
          if (mounted) {
            setSocket(null);
          }
        };
        _socket.onerror = function (e) {
          console.log(`[${name}] Socket error`, e);
          setConnected(false);
          if (mounted) {
            setSocket(null);
          }
        };
        _socket.onopen = () => {
          setConnecting(false);
          setTimeoutSeconds(0);
          setConnected(true);
          console.log(`[${name}] Connection established.`);
          if (messageBuffer.current.length) {
            messageBuffer.current.forEach((m) => {
              _socket.send(JSON.stringify(m));
            });
            messageBuffer.current = [];
          }
        };
        setSocket(_socket);
      }, timeoutSeconds);
      setTimeoutSeconds((t) => Math.min(10000, t ? t * 2 : 2000));
    }
    return () => {
      mounted = false;
      if (socket) {
        console.log(`[${name}] Socket closed due to unmount.`);
        setConnected(false);
        socket.close();
        setMessage(null);
        setSocket(null);
        setConnecting(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketUrl, socket]);

  const sendSocketMessage = useCallback(
    (newMessage: SocketMessageRequest) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(newMessage));
      } else {
        console.log(`[${name}] Message not sent`, newMessage, socket);
        messageBuffer.current.push(newMessage);
      }
    },
    [name, socket]
  );

  const reset = (url: string | null) => {
    setConnecting(false);
    setMessage(null);
    setSocket(null);
    setSocketUrl(url);
    setConnected(false);
  };

  return {
    setSocketUrl,
    socket,
    reset,
    socketUrl,
    isConnecting,
    sendSocketMessage,
    message,
    isConnected,
  };
};

export default useSocket;
