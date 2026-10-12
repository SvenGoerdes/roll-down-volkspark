const NAME_KEY = 'rollDownName';
export const readName = () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } };
export const writeName = (v) => { try { localStorage.setItem(NAME_KEY, v); } catch { /* private mode */ } };

// Browsers word network failures differently ("Failed to fetch", "Load failed", "NetworkError …"), all TypeErrors.
export const FETCH_TIMEOUT = 8000;
export const netError = (err) =>
  (err instanceof TypeError || err.name === 'TimeoutError' ? 'Keine Verbindung – probier es gleich nochmal' : err.message);
