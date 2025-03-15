"use client";
import React, { useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Check,
    Menu,
    Share2,
    TrendingUp,
    Shield,
    AlertTriangle,
    Calculator,
    BookOpen,
} from "lucide-react";
import Image from "next/image";
import demo from "@/assets/demoFinsaathi.png";
import logo from "@/assets/loansaathi.png";
import bg from "@/assets/bg.jpg";
import wqr from "@/assets/whatsapp-qr.png";

import {
    ClerkProvider,
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from "@clerk/nextjs";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

import teamIllustration from "@/assets/team-illustration.png";
import TypewriterText from "@/components/TypewriterText";
import TypewriterTitle from "@/components/TypeWriterTitle";

const languages = {
    "en-IN": "English",
    "hi-IN": "हिंदी",
    "bn-IN": "বাংলা",
    "ta-IN": "தமிழ்",
    "te-IN": "తెలుగు",
    "mr-IN": "मराठी",
    "gu-IN": "ગુજરાતી",
    "kn-IN": "ಕನ್ನಡ",
    "ml-IN": "മലയാളം",
    "pa-IN": "ਪੰਜਾਬੀ",
};

const HomePage = () => {
    const [currentLanguage, setCurrentLanguage] = useState("en-IN");

    const languageSelector = (
        <select
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="bg-background border rounded-md px-2 py-1"
        >
            <option value="en-IN">English</option>
            {/* Add other languages here when needed */}
        </select>
    );

    return (
        <div
            className="font-inter min-h-screen"
            style={{
                background: `
                    linear-gradient(to bottom, 
                        rgba(255,255,255,0) 0%,
                        rgba(255,255,255,1) 100%
                    ),
                    linear-gradient(to bottom, 
                        var(--background) 0%,
                        var(--secondary) 10%
                    )
                `,
                position: "relative",
                zIndex: 0,
            }}
        >
            <div
                className="absolute inset-0 h-[100vh]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(16,185,129,0.3) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(16,185,129,0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: "80px 80px", // Changed from 40px to 80px
                    mask: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                    WebkitMask:
                        "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                }}
            />
            <header className="fixed w-full bg-background/80 backdrop-blur-sm z-50 border-b-[1px] border-emerald-500">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-16">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex justify-center items-center space-x-2 animate-fadeIn">
                            <Image
                                src={logo}
                                alt="Logo"
                                className="w-10 h-10"
                            />
                            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 inline-block pt-1">
                                Loanसाथी
                            </span>
                        </div>
                        <nav className="hidden md:flex items-center space-x-6">
                            <a
                                href="/"
                                className="text-foreground font-medium hover:text-primary transition-colors"
                            >
                                Home
                            </a>
                            <a
                                href="/dashboard"
                                className="text-muted-foreground font-medium hover:text-primary transition-colors"
                            >
                                Dashboard
                            </a>
                            <a
                                href="/dashboard/news"
                                className="text-muted-foreground font-medium hover:text-primary transition-colors"
                            >
                                Blogs
                            </a>
                            <SignedIn>
                                <UserButton />
                            </SignedIn>
                            <SignedOut>
                                <SignInButton />
                                <SignUpButton />
                            </SignedOut>
                            {languageSelector}
                            <ModeToggle />
                        </nav>
                        <div className="md:hidden">
                            <ModeToggle />
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Menu />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Menu</SheetTitle>
                                    </SheetHeader>
                                    <div className="mt-6 flex flex-col space-y-4">
                                        <a
                                            href="/"
                                            className="text-foreground font-medium hover:text-primary transition-colors"
                                        >
                                            Home
                                        </a>
                                        <a
                                            href="/dashboard"
                                            className="text-muted-foreground font-medium hover:text-primary transition-colors"
                                        >
                                            Dashboard
                                        </a>
                                        <a
                                            href="/dashboard/news"
                                            className="text-muted-foreground font-medium hover:text-primary transition-colors"
                                        >
                                            Blogs
                                        </a>
                                        <SignedIn>
                                            <UserButton />
                                        </SignedIn>
                                        <SignedOut>
                                            <SignInButton />
                                            <SignUpButton />
                                        </SignedOut>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                <section className="h-[90vh] flex items-center relative overflow-hidden">
                    <div className="absolute inset-0 animate-gradient-xy"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="text-center space-y-8 animate-fadeInUp w-full">
                            <a
                                href="/dashboard/loanBuddy"
                                className="group relative inline-flex items-center justify-center mt-32 -mb-3"
                            >
                                <div className="relative inline-flex justify-between items-center text-primary rounded-full py-2 px-6 text-base font-medium border border-emerald-200/30  backdrop-blur-sm bg-gray-100">
                                    <TrendingUp className="w-5 h-5 mr-2 animate-pulse" />
                                    AI-powered Loan Shark Detector
                                    <span className="ml-2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-sm font-bold">
                                        New
                                    </span>
                                </div>
                            </a>

                            <div className="space-y-6 relative">
                                <h1 className="text-7xl sm:text-8xl font-bold tracking-tight">
                                    Welcome to{" "}
                                    <span className="relative">
                                        <span className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 blur-2xl opacity-20"></span>
                                        <TypewriterTitle />
                                    </span>
                                </h1>

                                <p className="text-3xl sm:text-4xl text-muted-foreground/90 font-light max-w-3xl mx-auto">
                                    Your Personal Loan Assistant.
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-8 mt-40">
                                {" "}
                                {/* Changed from mt-16 to mt-32 */}
                                <div className="w-4xl relative group">
                                    {" "}
                                    {/* Changed from w-[600px] to w-[800px] */}
                                    {/* Chat container */}
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-2xl blur opacity-75 transition duration-1000 animate-tilt"></div>
                                    <div className="relative bg-white p-4 rounded-2xl shadow-md">
                                        {" "}
                                        {/* Changed colors and added shadow */}
                                        {/* Chat messages */}
                                        <div className="mb-4">
                                            <div className="flex items-start gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                                    {" "}
                                                    {/* WhatsApp green */}
                                                    <Image
                                                        src={logo}
                                                        alt="Loansaathi"
                                                        width={20}
                                                        height={20}
                                                    />
                                                </div>
                                                <div className="bg-[#DCF8C6] text-black px-4 py-2 rounded-2xl rounded-tl-none max-w-[80%] text-left">
                                                    {" "}
                                                    {/* WhatsApp message green */}
                                                    Welcome to Loanसाथी! I'm
                                                    here to help you with all
                                                    your loan-related queries.
                                                </div>
                                            </div>
                                        </div>
                                        {/* Chat input area */}
                                        <div className="flex items-center gap-2 bg-[#F0F2F5] p-2 rounded-xl">
                                            {" "}
                                            {/* WhatsApp input gray */}
                                            <div className="flex-1 px-4 py-2 bg-white rounded-xl">
                                                <TypewriterText
                                                    language={currentLanguage}
                                                />
                                            </div>
                                            <a href="/dashboard/loanBuddy">
                                                <button className="p-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-300 shadow-lg">
                                                    {" "}
                                                    {/* WhatsApp send button green */}
                                                    <ArrowRight size={24} />
                                                </button>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <SignedOut>
                                        <SignInButton>
                                            <Button className="rounded-full px-12 py-8 text-xl gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:-translate-y-1">
                                                Get Started{" "}
                                                <ArrowRight
                                                    size={24}
                                                    className="animate-bounce-x"
                                                />
                                            </Button>
                                        </SignInButton>
                                    </SignedOut>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
                    {/* Moved Awareness Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                        <div className="p-6 bg-card rounded-xl border hover:shadow-lg transition-all group">
                            <div className="mb-4 p-3 bg-red-100 rounded-lg w-fit group-hover:bg-red-200 transition-colors">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                Fraud Detection
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Identifies potential loan sharks and fraudulent
                                schemes using AI
                            </p>
                        </div>
                        <div className="p-6 bg-card rounded-xl border hover:shadow-lg transition-all group">
                            <div className="mb-4 p-3 bg-blue-100 rounded-lg w-fit group-hover:bg-blue-200 transition-colors">
                                <Shield className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                Safe Borrowing
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Verified lenders and secure transaction
                                recommendations
                            </p>
                        </div>
                        <div className="p-6 bg-card rounded-xl border hover:shadow-lg transition-all group">
                            <div className="mb-4 p-3 bg-green-100 rounded-lg w-fit group-hover:bg-green-200 transition-colors">
                                <Calculator className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                Risk Assessment
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Smart analysis of interest rates and repayment
                                terms
                            </p>
                        </div>
                        <div className="p-6 bg-card rounded-xl border hover:shadow-lg transition-all group">
                            <div className="mb-4 p-3 bg-purple-100 rounded-lg w-fit group-hover:bg-purple-200 transition-colors">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                Financial Education
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Resources to make informed borrowing decisions
                            </p>
                        </div>
                    </div>

                    {/* Awareness Carousel */}
                    <div className="mt-16 py-12 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-3xl border border-emerald-100 dark:border-emerald-900">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                                Why Loan Fraud Detection Matters
                            </h2>
                            <p className="text-muted-foreground mt-2">
                                Key statistics that highlight the importance of
                                staying protected
                            </p>
                        </div>

                        <div className="flex overflow-x-auto space-x-6 px-8 scrollbar-hide">
                            <div className="flex-none w-80 snap-center">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-emerald-200 dark:border-emerald-800 transform hover:scale-105 transition-transform">
                                    <div className="text-4xl font-bold text-emerald-600 mb-2">
                                        ₹7.5B+
                                    </div>
                                    <div className="font-semibold mb-2">
                                        Digital Loan Fraud in 2023
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        In India alone, digital loan frauds
                                        crossed ₹7.5 billion affecting thousands
                                        of borrowers
                                    </p>
                                </div>
                            </div>

                            <div className="flex-none w-80 snap-center scrollbar-hide">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-emerald-200 dark:border-emerald-800 transform hover:scale-105 transition-transform">
                                    <div className="text-4xl font-bold text-emerald-600 mb-2">
                                        60%
                                    </div>
                                    <div className="font-semibold mb-2">
                                        Rise in Loan Shark Cases
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Significant increase in predatory
                                        lending cases reported in the last year
                                    </p>
                                </div>
                            </div>

                            <div className="flex-none w-80 snap-center">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-emerald-200 dark:border-emerald-800 transform hover:scale-105 transition-transform">
                                    <div className="text-4xl font-bold text-emerald-600 mb-2">
                                        2.8M
                                    </div>
                                    <div className="font-semibold mb-2">
                                        Affected Borrowers
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Number of people affected by fraudulent
                                        lending practices in 2023
                                    </p>
                                </div>
                            </div>

                            <div className="flex-none w-80 snap-center">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-emerald-200 dark:border-emerald-800 transform hover:scale-105 transition-transform">
                                    <div className="text-4xl font-bold text-emerald-600 mb-2">
                                        85%
                                    </div>
                                    <div className="font-semibold mb-2">
                                        Prevention Rate
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Success rate in preventing loan fraud
                                        with AI detection systems
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 space-y-12 animate-fadeInUp">
                        {/* Feature Explanations */}
                        <div className="space-y-24 my-24">
                            {/* First feature - Image on left */}
                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                <Image
                                    src={demo}
                                    alt="Loan Detection"
                                    className="rounded-xl shadow-lg"
                                />
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold">
                                        Smart Loan Shark Detection
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Our AI-powered system analyzes loan
                                        offers to protect you from predatory
                                        lending practices and potential scams.
                                    </p>
                                </div>
                            </div>

                            {/* Second feature - Image on right */}
                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold">
                                        Document Verification
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Instant verification of loan documents
                                        using advanced AI technology to ensure
                                        authenticity and compliance.
                                    </p>
                                </div>
                                <Image
                                    src={demo}
                                    alt="Document Verification"
                                    className="rounded-xl shadow-lg"
                                />
                            </div>

                            {/* Third feature - Image on left */}
                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                <Image
                                    src={demo}
                                    alt="EMI Calculator"
                                    className="rounded-xl shadow-lg"
                                />
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold">
                                        Smart EMI Calculator
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Calculate your EMIs with precision and
                                        get personalized repayment schedules
                                        based on your financial profile.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Integration Section */}
                        <div>
                            <h2 className="mt-24 font-bold text-4xl">
                                Access all features on Whatsapp
                            </h2>
                            <section className="mt-4 bg-background p-8 rounded-2xl border shadow-lg">
                                <div className="grid md:grid-cols-2 gap-12 items-center">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Share2 className="text-black-600 w-8 h-8" />
                                            <h2 className="text-3xl font-semibold">
                                                Share Insights Instantly
                                            </h2>
                                        </div>
                                        <p className="text-lg text-muted-foreground">
                                            Generate comprehensive reports and
                                            share loan insights with your
                                            friends.
                                        </p>
                                        <div className="bg-muted p-6 rounded-xl">
                                            <p className="font-medium flex items-center gap-2">
                                                <span className="text-black-600">
                                                    ➤
                                                </span>{" "}
                                                Send
                                                <code className="mx-2 px-2 py-1 bg-primary/10 text-primary rounded">
                                                    join hurried-immediately
                                                </code>
                                                to
                                            </p>
                                            <p className="text-xl font-bold mt-2 flex items-center">
                                                <span className="bg-black-100 text-black-800 px-3 py-1 rounded-lg mr-2">
                                                    WhatsApp
                                                </span>
                                                +1 415 523 8886
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="rounded-xl border-2 border-purple-600 p-4 bg-white w-[220px] h-[220px] overflow-hidden ">
                                            {/* Placeholder for QR Code */}
                                            <Image
                                                src={wqr}
                                                alt="TrueSight Demo"
                                                className="w-fit"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </section>

                <section className="bg-emerald-500 text-white py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center animate-fadeInUp">
                            <h2 className="text-3xl font-bold mb-4">
                                Help Us Improve by giving your Feedback
                            </h2>
                            <p className="text-xl mb-8">
                                Your Feedback helps us develop even more, write
                                to us to let us know
                            </p>
                            <button className="px-6 py-3 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-all duration-300 ease-in-out hover:scale-105">
                                Write to us!
                            </button>
                        </div>
                    </div>
                </section>

                <footer className="bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-3xl font-semibold mb-4 flex items-center gap-2">
                                    <Image
                                        src={logo}
                                        alt="Logo"
                                        className="w-8 h-8"
                                    />
                                    Loanसाथी
                                </h3>
                                <p>
                                    Hack_Overflow @TheGreatIndianHackathon
                                    <br />
                                    15th March, 2025
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <h4 className="text-xl font-semibold mb-2">
                                    Connect with us
                                </h4>
                                <div className="flex space-x-4">
                                    <a
                                        href="#"
                                        className="text-primary hover:text-primary/80"
                                    >
                                        Instagram
                                    </a>
                                    <a
                                        href="#"
                                        className="text-primary hover:text-primary/80"
                                    >
                                        Twitter
                                    </a>
                                    <a
                                        href="#"
                                        className="text-primary hover:text-primary/80"
                                    >
                                        LinkedIn
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default HomePage;
