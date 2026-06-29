'use server'

import { cookies } from "next/headers";
import { v4 } from "uuid";

const KEY = "file-project-id"

export async function getFileSession() {
    const cookieStore = await cookies()
    return cookieStore.get(KEY)?.value ?? null
}

export async function setFileSession() {
    const cookieStore = await cookies()
    cookieStore.set(KEY, v4(), { secure: true, httpOnly: true })
}

export async function deleteFileSession() {
    const cookieStore = await cookies()
    cookieStore.delete(KEY)
}

export async function getOrCreateFileSession(): Promise<string> {
    const cookieStore = await cookies()
    const existing = cookieStore.get(KEY)?.value
    if (existing) return existing
    
    const uuid = v4()
    cookieStore.set(KEY, uuid, { secure: true, httpOnly: true })
    return uuid
}

