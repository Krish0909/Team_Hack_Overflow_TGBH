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
            className="font-inter bg-gradient-to-b from-background to-secondary/10 min-h-screen"
            style={{
                backgroundImage: `
            linear-gradient(to right, #e0e0e0 1px, transparent 1px),
            linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)
          `,
                backgroundSize: "40px 40px",
                zIndex: 0,
            }}
        >
            <header className="fixed w-full bg-background/80 backdrop-blur-sm z-50 border border-bottom-2 border-[#e0e0e0]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-2 animate-fadeIn">
                            <Image src={logo} alt="Logo" className="w-8 h-8 " />
                            <span className="text-2xl font-bold text-blue-500">
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

            <main className="pt-24">
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
                    <div className="text-center space-y-4 animate-fadeInUp">
                        <a href="/dashboard/loanBuddy">
                            <div className="inline-flex items-center bg-[#e7e7e7] text-primary rounded-full px-4 py-2 text-sm font-medium">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                AI-powered Loan Shark Detector
                                <span className="ml-2 px-2 py-0.5 bg-primary text-white rounded-full text-xs">
                                    New
                                </span>
                            </div>
                        </a>
                        <h1 className="text-5xl sm:text-6xl font-bold">
                            Welcome to <TypewriterTitle />
                        </h1>
                        <p className="text-2xl sm:text-3xl text-muted-foreground">
                            Your Personal{" "}
                            <span className="text-primary font-semibold">
                                Loan Assistant
                            </span>{" "}
                            for Smart Borrowing
                        </p>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            AI-powered platform for loan recommendations,
                            eligibility checking, and EMI calculations with
                            document verification.
                        </p>
                        <div className="flex flex-col items-center gap-4 mt-8">
                            <TypewriterText language={currentLanguage} />
                            <SignedOut>
                                <SignInButton>
                                    <Button className="rounded-full px-8 py-6 text-lg gap-2">
                                        Get Started <ArrowRight size={18} />
                                    </Button>
                                </SignInButton>
                            </SignedOut>
                            <SignedIn>
                                <Button
                                    className="rounded-full px-8 py-6 text-lg gap-2"
                                    asChild
                                >
                                    <a href="/dashboard">
                                        Go to Dashboard <ArrowRight size={18} />
                                    </a>
                                </Button>
                            </SignedIn>
                        </div>
                    </div>

                    <div className="mt-16 space-y-12 animate-fadeInUp">
                        {/* Awareness Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-6 bg-card rounded-xl border hover:shadow-lg transition-all group">
                                <div className="mb-4 p-3 bg-red-100 rounded-lg w-fit group-hover:bg-red-200 transition-colors">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    Fraud Detection
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    Identifies potential loan sharks and
                                    fraudulent schemes using AI
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
                                    Smart analysis of interest rates and
                                    repayment terms
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
                                    Resources to make informed borrowing
                                    decisions
                                </p>
                            </div>
                        </div>

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
                                                    join label-strength
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

                <section className="bg-blue-800 text-white py-16">
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
