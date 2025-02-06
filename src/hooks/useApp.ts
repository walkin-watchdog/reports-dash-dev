import { useState, useCallback } from 'react';

export const useApp = () => {
  const [_connection, _setConnection] = useState(null);
  const [_auth, _setAuth] = useState(null);
  const [_cookies, _setCookies] = useState(null);

  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

    button.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }, []);

  const rndStr = (len = 20) => {
    let text = " ";
    const chars = "abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < len; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  };

  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  };

  const getCookie = (name: string) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const deviceID = useCallback(() => {
    let deviceId = getCookie("device_id");
    if (!deviceId) {
      deviceId = rndStr(40);
      setCookie("device_id", deviceId, 3650);
    }
    return deviceId;
  }, []);

  return {
    createRipple,
    rndStr,
    setCookie,
    getCookie,
    deviceID
  };
};