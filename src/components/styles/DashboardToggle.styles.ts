export const toggleStyles = {
  container: 'relative flex items-center w-60 h-12 bg-gray-200 rounded-full shadow-lg',
  slider: (activeIndex: number) => 
    `absolute w-[33.33%] h-10 bg-indigo-500 rounded-full ${
      activeIndex === 0 ? 'translate-x-[0.25rem]' :
      'translate-x-[calc(92%+0.25rem)]'
    } transition-transform duration-300 ease-in-out`,
  button: (active: boolean) =>
    `flex items-center justify-center w-1/3 h-full cursor-pointer z-10 ${
      active ? 'text-white font-semibold' : 'text-gray-600'
    } transition-colors duration-300`,
  icon: (active: boolean) => `w-6 h-6 ${active ? 'mr-0' : 'mr-1'}`,
  iconPath: (active: boolean) => active ? 'fill-white' : 'fill-gray-600'
};