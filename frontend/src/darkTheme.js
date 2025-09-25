export const darkTheme = {
  "--background-color": "#0e0e22",
  "--card-bg": "#1a1b2f",
  "--hover-bg": "#27293d",
  "--font-color": "#f8f8ff",
  "--alert-color": "#ff3576",
};

export function applyTheme(theme) {
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}
