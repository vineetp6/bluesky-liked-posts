import classNames from 'classnames'
import { FormEvent, useEffect, useState } from 'react'
import './App.css'
import FriendlyError from './components/FriendlyError'
import Post from './components/Post'
import { Like, fetchLikedPosts } from './utils/api'
import Spinner from './components/Spinner'

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [profileHandle, setProfileHandle] = useState('jesopo.bsky.social')
  const [error, setError] = useState(null)
  const [likes, setLikes] = useState<Like[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  const load = (cursor?: string) => {
    setError(null)

    return fetchLikedPosts({ handle: profileHandle, cursor })
      .then(({ likes: newLikes, cursor: newCursor }) => {
        if (cursor) {
          setLikes([...likes, ...newLikes])
        } else {
          setLikes(newLikes)
        }
        setCursor(newCursor)
      })
      .catch((error) => {
        setLikes([])
        setCursor(undefined)
        setError(error.message)
      })
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsLoading(true)
    load().then(() => {
      setIsLoading(false)
    })
  }

  useEffect(() => {
    if (!cursor) {
      return
    }

    let fetchingMore = false
    function onScroll() {
      if (!fetchingMore && document.body.scrollHeight - window.scrollY < 2000) {
        fetchingMore = true
        load(cursor)
        // The cursor will change and the effect will run again
      }
    }
    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [cursor])

  return (
    <main>
      <h1 className="App__heading">Show my likes! ❤️</h1>

      <p className="App__subtitle">
        Enter your profile handle and get a list of posts you have liked
      </p>

      <form onSubmit={onSubmit}>
        <div className="form-field">
          <label htmlFor="profile-handle">Your profile handle</label>
          <input
            id="profile-handle"
            type="text"
            name="handle"
            placeholder="jesopo.bsky.social"
            value={profileHandle}
            onChange={(ev) => setProfileHandle(ev.target.value)}
          />
        </div>
      </form>

      <div
        className={classNames(
          'App__loading-card',
          isLoading && 'App__loading-card--visible'
        )}
        aria-hidden={!isLoading}
      >
        <div className="App__loading-card__inner">
          <Spinner />
          Loading your likes…
        </div>
      </div>

      {error ? (
        <FriendlyError
          className="App__like-error"
          heading="Error fetching likes"
          message={error}
        />
      ) : likes.length > 0 ? (
        <div
          className={classNames(
            'App__post-timeline',
            isLoading && 'App__post-timeline--loading'
          )}
        >
          {likes.map((like) =>
            'value' in like ? (
              <Post key={like.uri} uri={like.uri} post={like.value} />
            ) : (
              <FriendlyError
                key={like.uri}
                heading="Error fetching the post"
                message={like.error}
              />
            )
          )}
          {cursor ? (
            <div
              className="App__post-loading-card"
              aria-label="Loading more posts"
            >
              <Spinner />
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  )
}

export default App
