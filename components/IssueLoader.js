import { useState, useEffect, useRef } from "react";

export default function IssueLoader() {
  const [hasMore, setHasMore] = useState(true);
  const loader = useRef(null);
  return (
    <>{hasMore && <div ref={loader} className="h-1 bg-transparent"></div>}</>
  );
}
