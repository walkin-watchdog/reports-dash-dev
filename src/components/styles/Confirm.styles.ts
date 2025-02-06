export const confirmStyles = {
  overlay: 'fixed inset-0 bg-zinc-900 bg-opacity-90 transition-opacity',
  container: 'fixed inset-0 z-10 w-screen overflow-y-auto',
  wrapper: 'flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0',
  panel: 'relative transform overflow-hidden rounded-lg bg-zinc-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6',
  imageWrapper: 'mx-auto flex items-center justify-center rounded-full',
  image: 'mx-auto h-20 w-auto rounded-full',
  contentWrapper: 'mt-3 text-center sm:mt-5',
  title: 'text-2xl font-semibold leading-6 text-white tracking-wider',
  message: 'text-base text-gray-400 tracking-wide',
  buttonGroup: 'mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3',
  confirmButton: 'inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2',
  cancelButton: 'mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0'
};