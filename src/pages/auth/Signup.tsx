import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Signup = () => {
  const { user, loading, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return false;
    }
    if (!email.includes('@')) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return false;
    }
    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return false;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }
    if (!agreeToTerms) {
      setError("서비스 이용약관에 동의해주세요.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    
    if (!validateForm()) return;

    setSubmitting(true);
    
    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        setError(error.message || "회원가입에 실패했습니다.");
        toast({
          title: "회원가입 실패",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSuccess("회원가입이 완료되었습니다! 이메일을 확인해주세요.");
        toast({
          title: "회원가입 완료",
          description: "이메일을 확인해 로그인해주세요.",
        });
        
        // 폼 초기화
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setAgreeToTerms(false);
      }
    } catch (err) {
      const errorMessage = "회원가입 중 오류가 발생했습니다.";
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

  const handleGoogleSignup = async () => {
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message || "Google 회원가입에 실패했습니다.");
        toast({
          title: "Google 회원가입 실패",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = "Google 회원가입 중 오류가 발생했습니다.";
      setError(errorMessage);
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return { text: "", color: "" };
    if (password.length < 6) return { text: "약함", color: "text-red-500" };
    if (password.length < 8) return { text: "보통", color: "text-yellow-500" };
    return { text: "강함", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength();

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
          <CardTitle className="text-lg font-medium">회원가입</CardTitle>
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

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">{success}</p>
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
            />
            
            <div>
              <Input 
                type="password" 
                placeholder="비밀번호 (8자 이상)" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="text-sm"
                disabled={submitting}
              />
              {password && (
                <div className="mt-1 text-xs">
                  <span className="text-muted-foreground">강도: </span>
                  <span className={passwordStrength.color}>{passwordStrength.text}</span>
                </div>
              )}
            </div>

            <div>
              <Input 
                type="password" 
                placeholder="비밀번호 확인" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-sm"
                disabled={submitting}
              />
              {confirmPassword && (
                <div className="mt-1 text-xs">
                  {password === confirmPassword ? (
                    <span className="text-green-600">✓ 비밀번호가 일치합니다</span>
                  ) : (
                    <span className="text-red-500">✗ 비밀번호가 일치하지 않습니다</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start space-x-2 py-2">
              <Checkbox 
                id="terms" 
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                disabled={submitting}
              />
              <label
                htmlFor="terms"
                className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
              >
                서비스 이용약관 및 개인정보 처리방침에 동의합니다
              </label>
            </div>
            
            <Button 
              onClick={handleSubmit}
              className="w-full text-sm" 
              disabled={submitting}
            >
              {submitting ? '회원가입 중...' : '회원가입'}
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
            onClick={handleGoogleSignup}
            disabled={submitting}
          >
            Google로 계속하기
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <button 
                onClick={() => navigate('/auth/login')}
                className="text-primary underline hover:no-underline bg-transparent border-none p-0 cursor-pointer"
              >
                로그인
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Signup;