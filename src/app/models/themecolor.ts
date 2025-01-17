export interface ThemeColors {
  name: string;
  backgroundStart: string;
  backgroundEnd: string;
  textColor: string;
  className: string;
}

export const themeColorsMap: { [key: string]: ThemeColors } = {
  'default-theme': { name: 'Default', backgroundStart: '#F5F5F7', backgroundEnd: '#F5F5F7', textColor: 'black', className: 'default-theme' },
  'light-theme': { name: 'Light', backgroundStart: 'white', backgroundEnd: 'white', textColor: '#333', className: 'light-theme' },
  'blue-to-pink': { name: 'Blue to Pink', backgroundStart: '#1e3c72', backgroundEnd: '#2a5298', textColor: 'white', className: 'blue-to-pink' },
  'purple-to-blue': { name: 'Purple to Blue', backgroundStart: '#6a11cb', backgroundEnd: '#2575fc', textColor: 'white', className: 'purple-to-blue' },
  'red-to-orange': { name: 'Red to Orange', backgroundStart: '#ff416c', backgroundEnd: '#ff4b2b', textColor: 'white', className: 'red-to-orange' },
  'green-to-blue': { name: 'Green to Blue', backgroundStart: '#00b09b', backgroundEnd: '#96c93d', textColor: 'white', className: 'green-to-blue' },
  'yellow-to-red': { name: 'Yellow to Red', backgroundStart: '#f6d365', backgroundEnd: '#fda085', textColor: 'white', className: 'yellow-to-red' },
  'blue-to-turquoise': { name: 'Blue to Turquoise', backgroundStart: '#4facfe', backgroundEnd: '#00f2fe', textColor: 'white', className: 'blue-to-turquoise' },
  'pink-to-purple': { name: 'Pink to Purple', backgroundStart: '#ff9a9e', backgroundEnd: '#fad0c4', textColor: 'white', className: 'pink-to-purple' },
  'orange-to-yellow': { name: 'Orange to Yellow', backgroundStart: '#ff7e5f', backgroundEnd: '#feb47b', textColor: 'white', className: 'orange-to-yellow' },
  'blue-to-green': { name: 'Blue to Green', backgroundStart: '#00c6ff', backgroundEnd: '#0072ff', textColor: 'white', className: 'blue-to-green' },
  'dark-purple-to-red': { name: 'Dark Purple to Red', backgroundStart: '#5f2c82', backgroundEnd: '#49a09d', textColor: 'white', className: 'dark-purple-to-red' }
};