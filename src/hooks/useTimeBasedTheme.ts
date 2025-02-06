import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, selectAutoTheme } from '../store/slices/themeSlice';

const useTimeBasedTheme = () => {
  const dispatch = useDispatch();
  const autoToggle = useSelector(selectAutoTheme);

  useEffect(() => {
    if (!autoToggle) return; // Do not run auto theme logic if disabled

    const updateThemeBasedOnTime = () => {
      const now = new Date();
      const hour = now.getHours();
      // Set light mode between 6 AM and 6 PM, otherwise dark mode.
      if (hour >= 6 && hour < 18) {
        dispatch(setTheme('light'));
      } else {
        dispatch(setTheme('dark'));
      }
    };

    // Initial update.
    updateThemeBasedOnTime();

    // Check every minute.
    const intervalId = setInterval(updateThemeBasedOnTime, 60000);

    return () => clearInterval(intervalId);
  }, [dispatch, autoToggle]);
};

export default useTimeBasedTheme;