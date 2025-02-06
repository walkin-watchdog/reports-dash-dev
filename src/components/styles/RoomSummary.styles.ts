export const roomSummaryStyles = {
  container: (isActive: boolean, isTouchDevice: boolean) => 
    `${!isTouchDevice ? 'hover:bg-zinc-700' : ''} ${isActive ? 'bg-zinc-900' : ''} flex space-x-5 items-center py-1 px-1 sm:py-3 sm:px-3 mt-1 rounded-md cursor-pointer`,
  iconWrapper: (isEmpty: boolean, isFullyOccupied: boolean) => 
    `${isEmpty ? 'bg-zinc-600' : isFullyOccupied ? 'bg-green-50' : 'bg-yellow-50'} p-1.5 rounded-full`,
  icon: (type: 'alert' | 'empty' | 'occupied', isFullyOccupied?: boolean) => {
    const baseClasses = 'h-6 w-6 sm:h-9 sm:w-9';
    switch (type) {
      case 'alert':
        return `${baseClasses} fill-red-600`;
      case 'empty':
        return `${baseClasses} fill-zinc-800`;
      case 'occupied':
        return `${baseClasses} ${isFullyOccupied ? 'fill-green-600' : 'fill-yellow-600'}`;
    }
  },
  content: 'tracking-wide text-xs sm:text-sm',
  title: 'font-semibold text-zinc-200 line-clamp-1',
  status: 'text-zinc-400 line-clamp-1 capitalize',
  activity: 'text-zinc-400 line-clamp-1'
};