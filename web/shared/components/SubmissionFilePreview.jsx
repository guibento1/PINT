import React, { useMemo } from "react";
import SubmissionCard from "@shared/components/SubmissionCard";


const SubmissionFilePreview = ({
  url,
  filename,
  type = "application/pdf",
  date,
}) => {
  const derivedName = useMemo(() => {
    if (filename && typeof filename === "string") return filename;
    try {
      const u = new URL(url, window.location.origin);
      const nameFromPath = decodeURIComponent(
        u.pathname.split("/").pop() || ""
      );
      if (nameFromPath) return nameFromPath;
    } catch {}
    try {
      const u2 = new URL(url, window.location.origin);
      const qn = u2.searchParams.get("filename") || u2.searchParams.get("name");
      if (qn) return qn;
    } catch {}
    return "ficheiro";
  }, [url, filename]);

  if (!url) return null;

  return (
    <SubmissionCard
      filename={derivedName}
      type={type}
      date={date}
      url={url}
      statusLabel={undefined}
    />
  );
};

export default SubmissionFilePreview;
