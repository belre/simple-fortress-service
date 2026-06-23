import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    env: {
        storageApiFactoryType: process.env.STORAGE_API_FACTORY_TYPE
    }
}

export default nextConfig
