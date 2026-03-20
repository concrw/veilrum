import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const { user, loading, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message || "로그인에 실패했습니다.");
        toast({
          title: "로그인 실패",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // 로그인 성공 시 useEffect에서 자동 리다이렉트
        toast({
          title: "로그인 성공",
          description: "환영합니다!",
        });
      }
    } catch (err) {
      const errorMessage = "로그인 중 오류가 발생했습니다.";
      setError(errorMessage);
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message || "Google 로그인에 실패했습니다.");
        toast({
          title: "Google 로그인 실패",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = "Google 로그인 중 오류가 발생했습니다.";
      setError(errorMessage);
      toast({
        title: "오류", 
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mx-auto mt-5">VEILRUM</h1>
      </header>

      <Card className="bg-card/60 max-w-sm mx-auto">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg font-medium">로그인</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            당신의 관계 언어를 발견하세요
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Input 
              type="email" 
              placeholder="이메일" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm"
              disabled={submitting}
              onKeyPress={handleKeyPress}
            />
            
            <Input 
              type="password" 
              placeholder="비밀번호" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="text-sm"
              disabled={submitting}
              onKeyPress={handleKeyPress}
            />
            
            <Button 
              onClick={handleSubmit}
              className="w-full text-sm" 
              disabled={submitting}
            >
              {submitting ? '로그인 중...' : '로그인'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full text-sm" 
            onClick={handleGoogleLogin}
            disabled={submitting}
          >
            Google로 로그인
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              계정이 없으신가요?{' '}
              <button 
                onClick={() => navigate('/auth/signup')}
                className="text-primary underline hover:no-underline bg-transparent border-none p-0 cursor-pointer"
              >
                회원가입
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Login;