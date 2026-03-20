import { Helmet } from "react-helmet-async";
import { useMemo } from "react";

import Logo from "@/components/Logo";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  name: z.string().min(2, { message: "이름을 입력해주세요" }),
  email: z.string().email({ message: "유효한 이메일을 입력해주세요" }).optional().or(z.literal("")),
  purpose: z.enum(["self", "career", "decision"], { required_error: "목적을 선택해주세요" }),
});

type FormValues = z.infer<typeof schema>;

const Onboarding = () => {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", purpose: undefined as unknown as FormValues["purpose"] },
  });

  const canonical = useMemo(() => (typeof window !== "undefined" ? window.location.origin + "/onboarding" : "/onboarding"), []);

  const onSubmit = (values: FormValues) => {
    toast({ title: "환영합니다, PRIPER", description: `${values.name}님 온보딩이 저장되었습니다.` });
    navigate("/");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Helmet>
        <title>PRIPER 온보딩 — Prime Perspective 시작</title>
        <meta name="description" content="PRIPER 온보딩: 프로필 입력과 서비스 목적 선택으로 Prime Perspective 여정을 시작하세요." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      
        <header className="mb-6 text-center">
          <Logo size={48} className="mx-auto mb-3 opacity-90" />
          <h1 className="text-2xl tracking-widest font-light leading-tight uppercase">PRIME PERSPECTIVE</h1>
          <p className="text-xs text-muted-foreground tracking-wider mt-2 uppercase">ONBOARDING</p>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 uppercase tracking-wider font-light">
            <section aria-labelledby="profile" className="space-y-4">
              <h2 id="profile" className="text-xs uppercase tracking-[0.25em] text-muted-foreground">프로필</h2>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="tracking-widest">이름</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" className="rounded-none border-0 border-b border-border bg-transparent px-0 uppercase focus-visible:ring-0 focus-visible:ring-offset-0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="tracking-widest">이메일 (선택)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="YOU@DOMAIN.COM" className="rounded-none border-0 border-b border-border bg-transparent px-0 uppercase focus-visible:ring-0 focus-visible:ring-offset-0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section aria-labelledby="purpose" className="space-y-3">
              <h2 id="purpose" className="text-xs uppercase tracking-[0.25em] text-muted-foreground">서비스 목적</h2>
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup className="grid grid-cols-1 gap-3" onValueChange={field.onChange} defaultValue={field.value}>
                        <div className="flex items-center space-x-3 rounded-xl border border-border p-4 hover:bg-accent/30 transition-colors">
                          <RadioGroupItem value="self" id="p1" />
                          <FormLabel htmlFor="p1" className="font-normal tracking-widest">자기이해 심화</FormLabel>
                        </div>
                        <div className="flex items-center space-x-3 rounded-xl border border-border p-4 hover:bg-accent/30 transition-colors">
                          <RadioGroupItem value="career" id="p2" />
                          <FormLabel htmlFor="p2" className="font-normal tracking-widest">커리어 전환/설계</FormLabel>
                        </div>
                        <div className="flex items-center space-x-3 rounded-xl border border-border p-4 hover:bg-accent/30 transition-colors">
                          <RadioGroupItem value="decision" id="p3" />
                          <FormLabel htmlFor="p3" className="font-normal tracking-widest">의사결정 명료화</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <div className="pt-2 flex gap-3">
              <Button type="submit" className="flex-1 tracking-widest">시작하기</Button>
              <Button type="button" variant="secondary" className="px-4 tracking-widest" onClick={() => navigate("/")}>나중에</Button>
            </div>

            <p className="text-xs text-muted-foreground tracking-widest leading-relaxed">
              계속하면 개인정보 처리방침과 이용약관에 동의하게 됩니다.
            </p>
          </form>
        </Form>
      
    </main>
  );
};

export default Onboarding;
