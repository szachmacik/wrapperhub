import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Star, Zap, MessageSquare, Heart, Share2,
  CheckCircle2, Lock, ExternalLink, Users, Clock,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function ToolDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);

  const { data: wrapper, isLoading } = trpc.wrappers.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );
  const { data: ratingsData, refetch: refetchRatings } = trpc.ratings.getForWrapper.useQuery(
    { wrapperId: wrapper?.id ?? 0 },
    { enabled: !!wrapper?.id }
  );
  const { data: favList, refetch: refetchFav } = trpc.favorites.list.useQuery(
    undefined,
    { enabled: !!user }
  );
  const isFav = favList?.includes(wrapper?.id ?? 0) ?? false;

  const submitRating = trpc.ratings.submit.useMutation({
    onSuccess: () => {
      toast.success("Review submitted!");
      setReviewText("");
      setReviewRating(5);
      refetchRatings();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const toggleFav = trpc.favorites.toggle.useMutation({
    onSuccess: () => refetchFav(),
  });

  const avgRating = ratingsData?.stats?.avg ?? 0;
  const ratingCount = ratingsData?.stats?.count ?? 0;
  const reviews = ratingsData?.reviews ?? [];

  const categoryColors: Record<string, string> = {
    chat: "bg-blue-500/10 text-blue-600",
    image: "bg-pink-500/10 text-pink-600",
    document: "bg-orange-500/10 text-orange-600",
    code: "bg-green-500/10 text-green-600",
    audio: "bg-purple-500/10 text-purple-600",
    video: "bg-red-500/10 text-red-600",
    search: "bg-cyan-500/10 text-cyan-600",
    custom: "bg-gray-500/10 text-gray-600",
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!wrapper) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Tool not found</h2>
        <Button onClick={() => navigate("/marketplace")}>Browse Marketplace</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/marketplace")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Marketplace
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFav.mutate({ wrapperId: wrapper.id })}
              >
                <Heart className={`h-4 w-4 mr-1 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                {isFav ? "Saved" : "Save"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Main info */}
          <div className="md:col-span-2 space-y-6">
            {/* Hero */}
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm"
                style={{ background: (wrapper.color || "#7c3aed") + "20" }}
              >
                {wrapper.icon || "🤖"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold">{wrapper.name}</h1>
                  {wrapper.isFeatured && (
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      ⭐ Featured
                    </Badge>
                  )}
                  <Badge className={categoryColors[wrapper.category] || ""}>
                    {wrapper.category}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{wrapper.description || "AI-powered tool"}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {avgRating > 0 ? avgRating.toFixed(1) : "No ratings"} ({ratingCount})
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {wrapper.provider}
                  </span>
                </div>
              </div>
            </div>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What you can do</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {getFeatures(wrapper.category).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Reviews ({ratingCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Submit review */}
                {user ? (
                  <div className="space-y-3 pb-4 border-b">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onMouseEnter={() => setHoveredStar(s)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => setReviewRating(s)}
                          className="p-0.5"
                        >
                          <Star
                            className={`h-5 w-5 transition-colors ${
                              s <= (hoveredStar || reviewRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-sm text-muted-foreground ml-2">{reviewRating}/5</span>
                    </div>
                    <Textarea
                      placeholder="Share your experience with this tool..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={3}
                    />
                    <Button
                      size="sm"
                      disabled={submitRating.isPending}
                      onClick={() => submitRating.mutate({
                        wrapperId: wrapper.id,
                        rating: reviewRating,
                        review: reviewText || undefined,
                      })}
                    >
                      Submit Review
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pb-4 border-b">
                    <Lock className="h-4 w-4" />
                    <a href={getLoginUrl()} className="text-primary hover:underline">Sign in</a> to leave a review
                  </div>
                )}

                {/* Review list */}
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No reviews yet. Be the first!</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {(r.userName || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{r.userName || "User"}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3 w-3 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {r.review && <p className="text-sm text-muted-foreground pl-9">{r.review}</p>}
                        <Separator className="mt-3" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: CTA sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardContent className="p-5 space-y-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">{wrapper.icon || "🤖"}</div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{ratingCount} reviews</p>
                </div>

                <Separator />

                {user ? (
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/dashboard/tool/${wrapper.slug}`)}
                  >
                    <Zap className="h-4 w-4 mr-2" /> Use This Tool
                  </Button>
                ) : (
                  <>
                    <Button className="w-full" asChild>
                      <a href={getLoginUrl()}>
                        <Zap className="h-4 w-4 mr-2" /> Get Started Free
                      </a>
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      No credit card required
                    </p>
                  </>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">{wrapper.provider}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="outline" className="text-xs">{wrapper.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="flex items-center gap-1 text-green-600 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Active
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground text-center">
                  Powered by <span className="font-semibold text-foreground">WrapperHub</span>
                  <br />No API keys needed
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function getFeatures(category: string): string[] {
  const map: Record<string, string[]> = {
    chat: ["Natural language conversations", "Context-aware responses", "Multi-turn dialogue", "Markdown formatting support"],
    image: ["Text-to-image generation", "Style customization", "High-resolution output", "Multiple aspect ratios"],
    document: ["PDF & document analysis", "Key information extraction", "Summarization", "Q&A over documents"],
    code: ["Code generation & review", "Bug detection & fixes", "Multi-language support", "Explanation & documentation"],
    audio: ["Speech transcription", "Multi-language support", "Timestamp extraction", "Speaker detection"],
    video: ["Video summarization", "Scene analysis", "Caption generation", "Content moderation"],
    search: ["Web search integration", "Real-time information", "Source citations", "Fact verification"],
    custom: ["Custom AI workflows", "Flexible configuration", "API integration", "Specialized tasks"],
  };
  return map[category] || map.custom;
}
