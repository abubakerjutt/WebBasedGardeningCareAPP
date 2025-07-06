import { useEffect } from "react";

const usePageTitle = (title) => {
  useEffect(() => {
    const baseTitle = "Gardening Care App";
    document.title = title ? `${title} - ${baseTitle}` : baseTitle;

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = baseTitle;
    };
  }, [title]);
};

export default usePageTitle;
