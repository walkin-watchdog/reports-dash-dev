export const roomCellStyles = {
  container: (_platform: { os: string }) => 
    `flex-1 pr-3 overflow-y-auto overflow-x-hidden h-full py-4 sm:py-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-600 pb-1`,
  grid: (platform: { os: string }) => 
    `${platform.os === 'ios' ? 'pt-20 pb-20 md:pb-0 sm:pt-0' : ''} sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 grid grid-cols-1 gap-3`,
  button: (isVacant: boolean, isInactive: boolean) => 
    `${isInactive ? 'bg-zinc-800' : isVacant ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-zinc-100'} rounded-3xl h-full w-full overflow-hidden relative`,
  icon: 'absolute top-10 sm:top-5 lg:top-10 left-6 h-1/3 w-auto',
  statusIcon: 'absolute top-4 right-4 h-1/4 w-auto',
  text: (isVacant: boolean, isInactive: boolean, hasError: boolean) =>
    `${hasError ? 'text-red-600' : isInactive ? 'text-zinc-400' : isVacant ? 'text-zinc-400' : 'text-zinc-600'} absolute left-0 bottom-5 w-full pl-6 text-left text-wrap font-semibold`,
  errorOverlay: 'absolute top-0 left-0 h-full w-full bg-red-500 opacity-10',
  errorIcon: {
    wrapper: 'absolute top-4 left-0',
    container: 'mx-auto flex flex-shrink-0 items-center justify-center rounded-full bg-red-100 p-1.5',
    icon: 'h-4 w-4 text-red-600'
  }
};