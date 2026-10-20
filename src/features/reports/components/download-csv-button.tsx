"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadFile } from "@/lib/download";

/** Downloads one CSV export, with a spinner while it's generated. */
export function DownloadCsvButton({
  url,
  fileName,
  children,
  variant = "outline",
  size = "default",
}: {
  url: string;
  fileName: string;
  children: React.ReactNode;
  variant?: "outline" | "ghost";
  size?: "default" | "sm";
}) {
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    setLoading(true);
    try {
      await downloadFile(url, fileName);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't download the file");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button variant={variant} size={size} onClick={onClick} loading={loading}>
      <Download />
      {children}
    </Button>
  );
}
