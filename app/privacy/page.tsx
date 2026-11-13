import type { Metadata } from 'next'
import PrivacyView from '@/views/privacy/PrivacyView'

export const metadata: Metadata = {
  title: 'プライバシーポリシー — VeloAva',
}

export default function PrivacyPage() {
  return <PrivacyView />
}
