import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useNewsCheck = () => {
  const [hasUnreadNews, setHasUnreadNews] = useState(false);
  const [isCheckingNews, setIsCheckingNews] = useState(false);

  const checkForUnreadNews = async () => {
    if (isCheckingNews) return;
    
    setIsCheckingNews(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setHasUnreadNews(false);
        return;
      }

      // Get all active news
      const { data: activeNews, error: newsError } = await supabase
        .from('news')
        .select('id')
        .eq('is_active', true);

      if (newsError) {
        console.error('Error fetching active news:', newsError);
        setHasUnreadNews(false);
        return;
      }

      if (!activeNews || activeNews.length === 0) {
        setHasUnreadNews(false);
        return;
      }

      // Get news that user has already read
      const { data: readNews, error: readError } = await supabase
        .from('user_news_read')
        .select('news_id')
        .eq('user_id', user.user.id);

      if (readError) {
        console.error('Error fetching read news:', readError);
        setHasUnreadNews(false);
        return;
      }

      const readNewsIds = new Set(readNews?.map(r => r.news_id) || []);
      const hasUnread = activeNews.some(news => !readNewsIds.has(news.id));
      
      setHasUnreadNews(hasUnread);
    } catch (error) {
      console.error('Error checking for unread news:', error);
      setHasUnreadNews(false);
    } finally {
      setIsCheckingNews(false);
    }
  };

  useEffect(() => {
    // Check for unread news when user session is available
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        checkForUnreadNews();
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Small delay to ensure user is fully logged in
        setTimeout(() => {
          checkForUnreadNews();
        }, 1000);
      } else if (event === 'SIGNED_OUT') {
        setHasUnreadNews(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const resetNewsCheck = () => {
    setHasUnreadNews(false);
  };

  return {
    hasUnreadNews,
    isCheckingNews,
    checkForUnreadNews,
    resetNewsCheck
  };
};