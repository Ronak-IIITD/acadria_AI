import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export type { User, Session };

export const auth = {
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
  
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
  
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },
  
  signInWithPassword: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },
  
  signInWithOAuth: async (provider: 'google' | 'github') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
  
  resetPasswordForEmail: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  },
  
  updateUser: async (updates: { email?: string; password?: string; data?: Record<string, unknown> }) => {
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
    return data;
  },
};

export const database = {
  documents: {
    list: async (userId: string) => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    
    get: async (docId: string, userId: string) => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    
    create: async (userId: string, doc: { filename: string; content_type?: string; file_size?: number; chunks?: number }) => {
      const { data, error } = await supabase
        .from('documents')
        .insert({ user_id: userId, ...doc })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    
    delete: async (docId: string, userId: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', userId);
      if (error) throw error;
    },
  },
  
  highlights: {
    list: async (userId: string, documentId?: string) => {
      let query = supabase
        .from('highlights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (documentId) {
        query = query.eq('document_id', documentId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    
    create: async (userId: string, highlight: { document_id: string; content: string; color: string; page_number?: number }) => {
      const { data, error } = await supabase
        .from('highlights')
        .insert({ user_id: userId, ...highlight })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    
    delete: async (highlightId: string, userId: string) => {
      const { error } = await supabase
        .from('highlights')
        .delete()
        .eq('id', highlightId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    
    getByColor: async (userId: string, documentId: string, color: string) => {
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('user_id', userId)
        .eq('document_id', documentId)
        .eq('color', color)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  },
  
  chatHistory: {
    list: async (userId: string) => {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    
    get: async (sessionId: string, userId: string) => {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    
    create: async (userId: string, title: string = 'New Chat', documentId?: string) => {
      const { data, error } = await supabase
        .from('chat_history')
        .insert({ 
          user_id: userId, 
          title, 
          document_id: documentId,
          messages: [] 
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    
    update: async (sessionId: string, userId: string, messages: unknown[], title?: string) => {
      const updates: Record<string, unknown> = { 
        messages,
        updated_at: new Date().toISOString()
      };
      if (title) updates.title = title;
      
      const { data, error } = await supabase
        .from('chat_history')
        .update(updates)
        .eq('id', sessionId)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    
    delete: async (sessionId: string, userId: string) => {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);
      if (error) throw error;
    },
  },
  
  flashcards: {
    list: async (userId: string, documentId?: string) => {
      let query = supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId);
      
      if (documentId) {
        query = query.eq('document_id', documentId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    
    create: async (userId: string, flashcard: { document_id?: string; front: string; back: string }) => {
      const { data, error } = await supabase
        .from('flashcards')
        .insert({ user_id: userId, ...flashcard })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    
    update: async (flashcardId: string, userId: string, updates: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('flashcards')
        .update(updates)
        .eq('id', flashcardId)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    
    delete: async (flashcardId: string, userId: string) => {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', flashcardId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    
    getDue: async (userId: string) => {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review', new Date().toISOString())
        .order('next_review', { ascending: true });
      if (error) throw error;
      return data;
    },
  },
  
  quizzes: {
    list: async (userId: string, documentId?: string) => {
      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId);
      
      if (documentId) {
        query = query.eq('document_id', documentId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    
    create: async (userId: string, quiz: { document_id?: string; title: string; questions: unknown[] }) => {
      const { data, error } = await supabase
        .from('quizzes')
        .insert({ 
          user_id, 
          ...quiz,
          total_questions: quiz.questions.length
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    
    complete: async (quizId: string, userId: string, score: number) => {
      const { data, error } = await supabase
        .from('quizzes')
        .update({ 
          score, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', quizId)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },
};
