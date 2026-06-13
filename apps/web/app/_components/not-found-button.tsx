"use client";

import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { Home } from "lucide-react";

export function NotFoundButton() {
    return (
        <Button size="lg" onClick={() => window.location.href = routes.home()}>
            <Home size={16} />
            Back to home
        </Button>
    );
}