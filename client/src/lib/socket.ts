import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
    if (socket) {
        return socket;
    }

    socket = io(WS_URL, {
        auth: {
            token,
        },
        autoConnect: true,
    });

    socket.on('connect', () => {
        console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
    });

    socket.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    return socket;
};

export const getSocket = (): Socket | null => {
    return socket;
};

export const disconnectSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
