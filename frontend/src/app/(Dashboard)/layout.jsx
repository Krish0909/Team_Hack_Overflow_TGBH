"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { UserButton } from "@clerk/nextjs";
import {
    LayoutDashboard,
    Settings,
    Bot,
    Menu,
    X,
    FileText,
    LightBulb,
    User,
    CreditCard,
    BadgeDollarSign,
    ScrollText,
    MessagesSquare,
    Globe,
    Calculator,
    Newspaper,
} from "lucide-react";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";
import loanSaathiLogo from "@/assets/loansaathi.png";
import { languages } from "@/lib/translations";
import { useLanguage } from "@/lib/languageContext";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import FloatingAssistant from "@/components/FloatingAssistant";

export default function DashboardLayout({ children }) {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
    const { language, setLanguage } = useLanguage();

    const sidebarLinks = [
        {
            title: "Overview",
            href: "/dashboard",
            icon: LayoutDashboard,
            color: "text-blue-500",
        },
        {
            title: "Loan Assistant",
            href: "/dashboard/loanBuddy",
            icon: MessagesSquare,
            color: "text-green-500",
        },
        {
            title: "Eligibility Check",
            href: "/dashboard/eligibility",
            icon: BadgeDollarSign,
            color: "text-yellow-500",
        },
        {
            title: "EMI Analysis",
            href: "/dashboard/emiAnalysis",
            icon: Calculator,
            color: "text-orange-500",
        },
        {
          title: "Latest News",
          href: "/dashboard/news",
          icon: Newspaper,
          color: "text-rose-500",
      },
        {
            title: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
            color: "text-gray-500",
        },
    ];

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    useEffect(() => {
        if (!isLoaded || !user) return;

        const checkOnboardingStatus = async () => {
            try {
                const { data: profile, error } = await supabase
                    .from("user_profiles")
                    .select("clerk_id")
                    .eq("clerk_id", user.id)
                    .single();

                if (!profile || error) {
                    router.push("/onboarding");
                }
            } catch (error) {
                console.error("Error checking onboarding status:", error);
            } finally {
                setIsCheckingOnboarding(false);
            }
        };

        checkOnboardingStatus();
    }, [user, isLoaded, router]);

    if (!isLoaded || isCheckingOnboarding) {
        return <div>Loading...</div>;
    }

    const languageSelector = (
        <Select
            value={language}
            onValueChange={(value) => setLanguage(value, user.id)}
        >
            <SelectTrigger className="w-[180px]">
                <Globe className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en-IN">English</SelectItem>
                {/* Add other languages here when needed */}
            </SelectContent>
        </Select>
    );

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <div className="min-h-screen flex bg-gray-50">
                {/* Desktop Sidebar */}
                <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 md:h-screen md:fixed">
                    <div className="p-6">
                        <a href="/">
                            <div className="flex items-center gap-2">
                                <Image
                                    alt="logo"
                                    src={loanSaathiLogo}
                                    className="h-8 w-8"
                                />
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Loanसाथी
                                </h1>
                            </div>
                        </a>
                    </div>

                    <nav className="flex-1 px-4 pb-4">
                        <div className="space-y-4">
                            {sidebarLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
                                >
                                    <link.icon
                                        className={`h-5 w-5 ${link.color} group-hover:scale-110 transition-transform`}
                                    />
                                    <span className="text-sm font-medium">
                                        {link.title}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </nav>

                    <div className="p-4 border-t border-gray-200">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-4">
                                {languageSelector}
                                <ModeToggle />
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card">
                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "h-8 w-8",
                                        },
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        Your Account
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-screen">
                    {/* Mobile Header */}
                    <header className="md:hidden bg-white border-b border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={toggleMobileMenu}
                                    className="p-2 rounded-lg hover:bg-gray-100"
                                >
                                    {isMobileMenuOpen ? (
                                        <X className="h-6 w-6 text-gray-600" />
                                    ) : (
                                        <Menu className="h-6 w-6 text-gray-600" />
                                    )}
                                </button>
                                <a href="/">
                                    <div className="flex items-center gap-2">
                                        <Image
                                            alt="logo"
                                            src={loanSaathiLogo}
                                            className="h-8 w-8"
                                        />
                                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            Loanसाथी
                                        </h1>
                                    </div>
                                </a>
                            </div>
                            <UserButton />
                        </div>
                    </header>

                    {/* Mobile Navigation Menu */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden fixed inset-0 z-50 bg-gray-800 bg-opacity-50">
                            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
                                <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-gray-200">
                                        <button
                                            onClick={toggleMobileMenu}
                                            className="p-2 rounded-lg hover:bg-gray-100"
                                        >
                                            <X className="h-6 w-6 text-gray-600" />
                                        </button>
                                    </div>
                                    <nav className="flex-1 px-4 py-4">
                                        <div className="space-y-4">
                                            {sidebarLinks.map((link) => (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    onClick={toggleMobileMenu}
                                                    className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
                                                >
                                                    <link.icon
                                                        className={`h-5 w-5 ${link.color} group-hover:scale-110 transition-transform`}
                                                    />
                                                    <span className="text-sm font-medium">
                                                        {link.title}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-auto md:ml-[16rem]">
                        {children}
                    </main>
                </div>
                <FloatingAssistant />
            </div>
        </ThemeProvider>
    );
}
