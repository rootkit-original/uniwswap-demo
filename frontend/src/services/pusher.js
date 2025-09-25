import Pusher from 'pusher-js'

const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'us2',
  forceTLS: true
})

export default pusher