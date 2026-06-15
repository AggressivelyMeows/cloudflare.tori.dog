type AuthValidationResult = {
  user: {
    email: string,
    id: string
  }
  profile: {
    displayName: string,
    bio: string,
    firstName: string,
    lastName: string,
    pronouns: string
  }
}

export const validateAuth = async (event: any): Promise<AuthValidationResult> => {
  const { env: cloudflare } = event.context.cloudflare
  const authHeader = event.req.headers['authorization'] || event.req.headers['Authorization']

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing Authorization header'
    })
  }

  const token = authHeader.split(' ')[1]

  const authBinding = await cloudflare.AUTH.fetch(
    'https://id.tori.dog/api/auth/profile',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  ).then((x: any) => x.json())

  if (!authBinding.success) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authorization header is invalid, failed to fetch user profile'
    })
  }

  return {
    user: authBinding.user,
    profile: authBinding.profile
  }
}