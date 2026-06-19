import { createBrowserRouter } from 'react-router-dom'
import HomePage from '../routes/HomePage.jsx'
import WorkPage from '../routes/WorkPage.jsx'
import WorkSinglePage from '../routes/WorkSinglePage.jsx'
import AboutPage from '../routes/AboutPage.jsx'
import ServicesPage from '../routes/ServicesPage.jsx'
import ServicesSinglePage from '../routes/ServicesSinglePage.jsx'
import ThinkingPage from '../routes/ThinkingPage.jsx'
import ThinkingSinglePage from '../routes/ThinkingSinglePage.jsx'
import ContactPage from '../routes/ContactPage.jsx'
import Est2014PageInfinite from '../routes/Est2014Page-infinite.jsx'
import LandingPage from '../routes/LandingPage.jsx'
import DefaultPage from '../routes/DefaultPage.jsx'
import NotFoundPage from '../routes/NotFoundPage.jsx'
import RootLayout from '../routes/RootLayout.jsx'
import {
  createHomeLoader,
  createWorkLoader,
  createWorkSingleLoader,
  createAboutLoader,
  createServicesLoader,
  createServicesSinglePageLoader,
  createThinkingPageLoader,
  createThinkingSinglePageLoader,
  createContactPageLoader,
  createEst2014PageLoader,
  createLandingPageLoader,
  createDefaultPageLoader,
  createRootLoader,
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
        element: <WorkPage />,
        loader: createWorkLoader(),
        handle: { pageBg: 'light' },
      },
      {
        path: 'work/:slug',
        element: <WorkSinglePage />,
        loader: createWorkSingleLoader(),
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
        element: <ServicesPage />,
        loader: createServicesLoader(),
        handle: { pageBg: 'light' },
      },
      {
        path: 'services/:slug',
        element: <ServicesSinglePage />,
        loader: createServicesSinglePageLoader(),
        handle: { pageBg: 'light' },
      },
      {
        path: 'thinking',
        element: <ThinkingPage />,
        loader: createThinkingPageLoader(),
        handle: { pageBg: 'light' },
      },
      {
        path: 'thinking/:filterSlug',
        element: <ThinkingPage />,
        loader: createThinkingPageLoader(),
        handle: { pageBg: 'light' },
      },
      {
        path: 'thinking/:topic/:slug',
        element: <ThinkingSinglePage />,
        loader: createThinkingSinglePageLoader(),
        handle: { pageBg: 'light' },
      },
      {
        path: 'contact',
        element: <ContactPage />,
        loader: createContactPageLoader(),
        handle: { pageBg: 'dark' },
      },
      {
        path: 'est-2014',
        element: <Est2014PageInfinite />,
        loader: createEst2014PageLoader(),
        handle: { pageBg: 'light', hideFooter: true },
      },
      {
        path: 'privacy-policy',
        element: <DefaultPage />,
        loader: createDefaultPageLoader(),
        handle: { pageBg: 'light' },
      },
      {
        path: 'site-map',
        element: <DefaultPage />,
        loader: createDefaultPageLoader(),
        handle: { pageBg: 'light' },
      },
      {
        path: '*',
        element: <LandingPage />,
        loader: createLandingPageLoader(),
        handle: { pageBg: 'light' },
      },
    ],
  },
])