// どのページにも当てはまらないURL（/abc、/en/abc など）を受け取って 404 にする。
// これがないと Next.js の既定の404（英語・サイトのデザインなし・<html lang> なし）になるため、
// ここで notFound() を呼んで、同じフォルダの階層の not-found.tsx（サイトのデザイン・言語つき）を表示させる
import { notFound } from 'next/navigation'

export default function CatchAll() {
  notFound()
}
