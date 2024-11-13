import { useSession } from "next-auth/react"
import Layout from "../components/layout"

export default function MePage() {
  const { data, ...other } = useSession()

  return (
    <Layout>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <pre>{JSON.stringify(other, null, 2)}</pre>
    </Layout>
  )
}
