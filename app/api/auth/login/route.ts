
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // In a real application, you would validate the credentials against a database
    if (email === process.env.AUTH_USER && password === process.env.AUTH_PASS) {
      // If validation is successful, you might create a session or a JWT
      // For this example, we'll just return a success message
      cookies().set('auth_token', 'true', { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 12 }); // Set cookie for 12 hours
      return NextResponse.json({ message: 'Login successful' })
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
