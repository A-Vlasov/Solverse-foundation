import { NextResponse } from 'next/server';
import { createServerClient } from '@/modules/supabase/server';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/modules/auth/lib/getUserFromSession'; 


export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  const user = await getUserFromSession(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    
    const { data, error } = await supabase
      .from('achievements') 
      .select('*')
      .eq('user_id', user.id)
      .limit(0); 

    if (error) {
      console.error('Error fetching achievements:', error);
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error('API route error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 