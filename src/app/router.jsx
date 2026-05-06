import { createBrowserRouter } from 'react-router-dom'
import AboutPage from '../routes/AboutPage.jsx'
import CollectionPage from '../routes/CollectionPage.jsx'
import EntryPage from '../routes/EntryPage.jsx'
import HomePage from '../routes/HomePage.jsx'
import NotFoundPage from '../routes/NotFoundPage.jsx'
import RootLayout from '../routes/RootLayout.jsx'
import StaticPage from '../routes/StaticPage.jsx'
import {
  createAboutLoader,
  createCollectionLoader,
  createEntryLoader,
  createHomeLoader,
  createRootLoader,
  createStaticPageLoader,
} from '../routes/loaders.js'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    loader: createRootLoader(),
    hydrateFallbackElement: <div className="shell py-10" />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
        loader: createHomeLoader(),
        handle: { pageBg: 'light' },
      },
      {
        path: 'work',
        element: <CollectionPage collectionKey="work" />,
        loader: createCollectionLoader('work'),
        handle: { pageBg: 'light' },
      },
      {
        path: 'work/:slug',
        element: <EntryPage collectionKey="work" />,
        loader: createEntryLoader('work'),
        handle: { pageBg: 'light' },
      },
      {
        path: 'about',
        element: <AboutPage />,
        loader: createAboutLoader(),
        handle: { pageBg: 'dark' },
      },
      {
        path: 'services',
        element: <StaticPage pageKey="services" />,
        loader: createStaticPageLoader('services'),
        handle: { pageBg: 'light' },
      },
      {
        path: 'thinking',
        element: <CollectionPage collectionKey="thinking" />,
        loader: createCollectionLoader('thinking'),
        handle: { pageBg: 'light' },
      },
      {
        path: 'thinking/:slug',
        element: <EntryPage collectionKey="thinking" />,
        loader: createEntryLoader('thinking'),
        handle: { pageBg: 'light' },
      },
      {
        path: 'contact',
        element: <StaticPage pageKey="contact" />,
        loader: createStaticPageLoader('contact'),
        handle: { pageBg: 'light' },
      },
      {
        path: 'est-2014',
        element: <StaticPage pageKey="est2014" />,
        loader: createStaticPageLoader('est2014'),
        handle: { pageBg: 'light' },
      },
    ],
  },
])