import { Button } from '@mui/material';
import { componentStyles } from '../../theme';

const SkipLink = () => {
  return (
    <Button
      variant="contained"
      sx={componentStyles.skipLink}
      onClick={() => {
        const main = document.querySelector('main');
        if (main) {
          main.focus();
          main.scrollIntoView();
        }
      }}
    >
      Skip to main content
    </Button>
  );
};

export default SkipLink;
