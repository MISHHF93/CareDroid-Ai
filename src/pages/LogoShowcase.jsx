import Logo from '@/components/Logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Logo Showcase Page
 * Displays the CareDroid logo in various sizes and contexts
 * Access at: /logo-showcase (development only)
 */
export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            CareDroid Logo Assets
          </h1>
          <p className="text-neutral-600">
            Official brand logo in various sizes and contexts
          </p>
        </div>

        {/* Primary Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-12 bg-white rounded-lg">
              <Logo size={200} animate />
            </div>
            <p className="text-sm text-neutral-600 text-center mt-4">
              200x200px - Main application logo
            </p>
          </CardContent>
        </Card>

        {/* Size Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Size Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[32, 64, 96, 128].map(size => (
                <div key={size} className="flex flex-col items-center">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <Logo size={size} />
                  </div>
                  <p className="text-xs text-neutral-600 mt-2">{size}x{size}px</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dark Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Dark Mode Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Light background */}
              <div>
                <div className="bg-white rounded-lg p-8 flex items-center justify-center">
                  <Logo size={120} />
                </div>
                <p className="text-sm text-neutral-600 text-center mt-2">Light Background</p>
              </div>

              {/* Dark background */}
              <div>
                <div className="bg-neutral-900 rounded-lg p-8 flex items-center justify-center">
                  <Logo size={120} />
                </div>
                <p className="text-sm text-neutral-600 text-center mt-2">Dark Background</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gradient Backgrounds */}
        <Card>
          <CardHeader>
            <CardTitle>On Gradient Backgrounds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-8 flex items-center justify-center">
                  <Logo size={96} />
                </div>
                <p className="text-sm text-neutral-600 text-center mt-2">Blue Gradient</p>
              </div>

              <div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-8 flex items-center justify-center">
                  <Logo size={96} />
                </div>
                <p className="text-sm text-neutral-600 text-center mt-2">Purple Gradient</p>
              </div>

              <div>
                <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-lg p-8 flex items-center justify-center">
                  <Logo size={96} />
                </div>
                <p className="text-sm text-neutral-600 text-center mt-2">Green Gradient</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PWA Icons */}
        <Card>
          <CardHeader>
            <CardTitle>PWA Icon Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {[72, 96, 128, 144, 152, 192, 384, 512].map(size => (
                <div key={size} className="flex flex-col items-center">
                  <div className="bg-neutral-100 rounded-lg p-2 shadow-sm flex items-center justify-center" style={{ width: 64, height: 64 }}>
                    <img 
                      src={`/icon-${size}x${size}.png`} 
                      alt={`${size}x${size} icon`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-neutral-600 mt-1">{size}px</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="h-24 rounded-lg" style={{ background: 'linear-gradient(135deg, #8FD6F4 0%, #A4E3B2 100%)' }} />
                <p className="text-sm font-medium text-neutral-900 mt-2">Primary Gradient</p>
                <p className="text-xs text-neutral-600">#8FD6F4 → #A4E3B2</p>
              </div>

              <div>
                <div className="h-24 bg-[#51B988] rounded-lg" />
                <p className="text-sm font-medium text-neutral-900 mt-2">Accent Green</p>
                <p className="text-xs text-neutral-600">#51B988</p>
              </div>

              <div>
                <div className="h-24 bg-white border-2 border-neutral-200 rounded-lg" />
                <p className="text-sm font-medium text-neutral-900 mt-2">White</p>
                <p className="text-xs text-neutral-600">#FFFFFF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Usage in Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-neutral-900 mb-2">React Component:</p>
                <pre className="bg-neutral-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
{`import Logo from '@/components/Logo';

// Basic usage
<Logo size={80} />

// With animation
<Logo size={120} animate />

// With custom className
<Logo size={64} className="mx-auto" />`}
                </pre>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-900 mb-2">HTML:</p>
                <pre className="bg-neutral-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
{`<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

<!-- Mask Icon (Safari) -->
<link rel="mask-icon" href="/logo.svg" color="#51B988" />`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-neutral-500 pb-8">
          <p>CareDroid™ Logo - All Rights Reserved</p>
          <p className="mt-1">For brand guidelines and usage policies, see /public/LOGO_README.md</p>
        </div>
      </div>
    </div>
  );
}
