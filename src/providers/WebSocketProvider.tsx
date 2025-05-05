import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  setEntities,
  setLog,
  setRoomState,
  setRoomInactive,
} from '../store/slices/mainSlice';
import {
  setRooms,
  setLabels,
  updateRoom,
  setLoading,
} from '../store/slices/liveSlice';

import { WebSocketService, WebSocketMessageType } from '../services/websocket';
import { CacheStorage } from '../services/cacheStorage';
import {
  generateMockLiveData,
  generateMockRoomUpdate,
} from '../services/mockData';

import { Room } from '../types';

interface Props {
  children: React.ReactNode;
}

const WebSocketProvider: React.FC<Props> = ({ children }) => {
  const dispatch      = useDispatch();
  const selectedHotel = useSelector((s: RootState) => s.auth.selectedHotel);
  const cache         = CacheStorage.getInstance();

  useEffect(() => {
    if (!selectedHotel) return;
    dispatch(setLoading(true));
    /********** DEV-MODE (kept from old provider) **************************/
    if (import.meta.env.DEV) {

      let timer: ReturnType<typeof setInterval>;

      (async () => {
        // hydrate cache or generate fresh mock data
        let rooms  = await cache.getRooms(selectedHotel);
        let labels = await cache.getLabels();

        if (!rooms || !labels) {
          const mock = generateMockLiveData(selectedHotel);
          rooms  = mock.rooms;
          labels = mock.labels;
          await cache.setRooms(selectedHotel, rooms);
          await cache.setLabels(labels);
        }

        dispatch(setRooms(rooms));
        dispatch(setLabels(labels));
        dispatch(setLoading(false));

        // random room churn every 5 s
        timer = setInterval(() => {
          const rand = Math.floor(Math.random() * rooms.length);
          dispatch(updateRoom(generateMockRoomUpdate(rooms[rand])));
        }, 5000);
      })();

      return () => clearInterval(timer);
    }
    /********** PROD-MODE ***********************************************/

    const ws = WebSocketService.getInstance();

    // Simple debounce helper
    const debounce = (fn: () => void, ms = 200) => {
      let t: number;
      return () => {
        clearTimeout(t);
        t = window.setTimeout(fn, ms);
      };
    };

    // Pause/resume on tab visibility changes
    const handleVisibility = debounce(() => {
      if (document.visibilityState === 'hidden') {
        ws.disconnect();
      } else {
        ws.connect();
      }
    }, 200);

    document.addEventListener('visibilitychange', handleVisibility);

    ws.connect();

    const unsubscribe = ws.subscribe((msg) => {
      switch (msg.type) {
        case WebSocketMessageType.INITIAL_DATA: {
          const { rooms, labels } = msg.payload as {
            rooms: Room[];
            labels: Record<string, string>;
          };
          dispatch(setEntities({ rooms, labels }));
          dispatch(setLog(false));
          dispatch(setLoading(false));
          break;
        }
        case WebSocketMessageType.ROOM_UPDATE: {
          const updates = Array.isArray(msg.payload)
            ? msg.payload
            : [msg.payload];

          updates.forEach((update) => {
            if (
              update &&
              typeof update === 'object' &&
              'id' in update &&
              'is_vacant' in update &&
              'is_inactive' in update
            ) {
              const { id, is_vacant, is_inactive } = update as {
                id: string;
                is_vacant: boolean;
                is_inactive: boolean;
              };
              dispatch(setRoomState   ({ id, state:    is_vacant }));
              dispatch(setRoomInactive({ id, inactive: is_inactive }));
            }
          });
          dispatch(setLoading(false));
          break;
        }
      }
    });

    return () => {
      unsubscribe();
      ws.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [dispatch, selectedHotel]);

  return <>{children}</>;
};

export default WebSocketProvider;