import HomeView from '@/views/home/HomeView'

export default function HomePage({ searchParams }: { searchParams: { error?: string } }) {
  return <HomeView errorCode={searchParams.error} />
}
