export const getJoinSpaceId = () => {
  if (typeof window === 'undefined') return '';
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('join')?.trim() || '';
  } catch (err) {
    console.warn('Error reading join param:', err);
    return '';
  }
};

export const clearJoinParam = () => {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('join');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  } catch (err) {
    console.warn('Error clearing join param:', err);
  }
};
