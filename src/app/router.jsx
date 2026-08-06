import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet, useOutletContext } from 'react-router-dom'
import RootLayout from '../routes/RootLayout.jsx'
import NotFoundPage from '../routes/NotFoundPage.jsx'
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

const HomePage = lazy(() => import('../routes/HomePage.jsx'))
const WorkPage = lazy(() => import('../routes/WorkPage.jsx'))
const WorkSinglePage = lazy(() => import('../routes/WorkSinglePage.jsx'))
const AboutPage = lazy(() => import('../routes/AboutPage.jsx'))
const ServicesPage = lazy(() => import('../routes/ServicesPage.jsx'))
const ServicesSinglePage = lazy(() => import('../routes/ServicesSinglePage.jsx'))
const ThinkingPage = lazy(() => import('../routes/ThinkingPage.jsx'))
const ThinkingSinglePage = lazy(() => import('../routes/ThinkingSinglePage.jsx'))
const ContactPage = lazy(() => import('../routes/ContactPage.jsx'))
const Est2014Page = lazy(() => import('../routes/Est2014Page.jsx'))
const LandingPage = lazy(() => import('../routes/LandingPage.jsx'))
const DefaultPage = lazy(() => import('../routes/DefaultPage.jsx'))

function PageOutlet() {
  const context = useOutletContext()
  return (
    <Suspense fallback={null}>
      <Outlet context={context} />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    loader: createRootLoader(),
    hydrateFallbackElement: <div className="shell py-10" />,
    children: [
      {
        element: <PageOutlet />,
        // Eager import — a lazy errorElement fails after deploys when the old
        // hashed chunk is gone, and then React Router shows its crash screen.
        errorElement: <NotFoundPage />,
        handle: { pageBg: 'light' },
        children: [
          {
            index: true,
            element: <HomePage />,
            loader: createHomeLoader(),
            handle: { pageBg: 'light' },
          },
          {
            path: 'work/',
            element: <WorkPage />,
            loader: createWorkLoader(),
            handle: { pageBg: 'light' },
          },
          {
            path: 'work/:slug/',
            element: <WorkSinglePage />,
            loader: createWorkSingleLoader(),
            handle: { pageBg: 'light' },
          },
          {
            path: 'about/',
            element: <AboutPage />,
            loader: createAboutLoader(),
            handle: { pageBg: 'dark' },
          },
          {
            path: 'services/',
            element: <ServicesPage />,
            loader: createServicesLoader(),
            handle: { pageBg: 'light' },
          },
          {
            path: 'services/:slug/',
            element: <ServicesSinglePage />,
            loader: createServicesSinglePageLoader(),
            handle: { pageBg: 'light' },
          },
          {
            path: 'thinking/',
            element: <ThinkingPage />,
            loader: createThinkingPageLoader(),
            handle: { pageBg: 'light' },
          },
          {
            path: 'thinking/:filterSlug/',
            element: <ThinkingPage />,
            loader: createThinkingPageLoader(),
            handle: { pageBg: 'light' },
          },
          {
            path: 'thinking/:topic/:slug/',
            element: <ThinkingSinglePage />,
            loader: createThinkingSinglePageLoader(),
            handle: { pageBg: 'light' },
          },
          {
            path: 'contact/',
            element: <ContactPage />,
            loader: createContactPageLoader(),
            handle: { pageBg: 'dark' },
          },
          {
            path: 'est-2014/',
            element: <Est2014Page />,
            loader: createEst2014PageLoader(),
            handle: { pageBg: 'dark' },
          },
          {
            path: 'privacy-policy/',
            element: <DefaultPage />,
            loader: createDefaultPageLoader(),
            handle: { pageBg: 'light' },
          },
          {
            path: 'site-map/',
            element: <DefaultPage />,
            loader: createDefaultPageLoader(),
            handle: { pageBg: 'light' },
          },
          {
            path: ':slug/',
            element: <LandingPage />,
            loader: createLandingPageLoader(),
            handle: { pageBg: 'light' },
          },
          {
            path: '*',
            loader: () => {
              throw new Response('Not found', { status: 404 })
            },
          },
        ],
      },
    ],
  },
])
