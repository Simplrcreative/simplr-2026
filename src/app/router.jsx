import { createBrowserRouter } from 'react-router-dom'
import CollectionPage from '../routes/CollectionPage.jsx'
import EntryPage from '../routes/EntryPage.jsx'
import HomePage from '../routes/HomePage.jsx'
import NotFoundPage from '../routes/NotFoundPage.jsx'
import RootLayout from '../routes/RootLayout.jsx'
import StaticPage from '../routes/StaticPage.jsx'
import {
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
      },
      {
        path: 'work',
        element: <CollectionPage collectionKey="work" />,
        loader: createCollectionLoader('work'),
      },
      {
        path: 'work/:slug',
        element: <EntryPage collectionKey="work" />,
        loader: createEntryLoader('work'),
      },
      {
        path: 'about',
        element: <StaticPage pageKey="about" />,
        loader: createStaticPageLoader('about'),
      },
      {
        path: 'services',
        element: <StaticPage pageKey="services" />,
        loader: createStaticPageLoader('services'),
      },
      {
        path: 'thinking',
        element: <CollectionPage collectionKey="thinking" />,
        loader: createCollectionLoader('thinking'),
      },
      {
        path: 'thinking/:slug',
        element: <EntryPage collectionKey="thinking" />,
        loader: createEntryLoader('thinking'),
      },
      {
        path: 'contact',
        element: <StaticPage pageKey="contact" />,
        loader: createStaticPageLoader('contact'),
      },
      {
        path: 'est-2014',
        element: <StaticPage pageKey="est2014" />,
        loader: createStaticPageLoader('est2014'),
      },
    ],
  },
])