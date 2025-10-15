import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function LoginDiagnostic() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    const diagnostic: any = {
      steps: [],
      canLogin: false,
      issues: [],
      solutions: []
    };

    try {
      // Step 1: Test Authentication
      diagnostic.steps.push({ name: 'Testing authentication...', status: 'running' });
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        diagnostic.steps[0] = { 
          name: 'Authentication Test', 
          status: 'failed',
          error: authError.message 
        };
        diagnostic.issues.push('Authentication failed: ' + authError.message);
        
        if (authError.message.includes('Invalid login credentials')) {
          diagnostic.solutions.push('✓ Check that your email and password are correct');
          diagnostic.solutions.push('✓ Ensure your account exists in the Supabase Auth users table');
        }
        setResults(diagnostic);
        setLoading(false);
        return;
      }

      diagnostic.steps[0] = { 
        name: 'Authentication Test', 
        status: 'success',
        data: { userId: authData.user?.id }
      };

      const userId = authData.user?.id;

      // Step 2: Check User Profile
      diagnostic.steps.push({ name: 'Checking user profile...', status: 'running' });
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        diagnostic.steps[1] = { 
          name: 'User Profile Check', 
          status: 'failed',
          error: profileError.message 
        };
        diagnostic.issues.push('Profile check failed: ' + profileError.message);
      } else if (!profileData) {
        diagnostic.steps[1] = { 
          name: 'User Profile Check', 
          status: 'failed',
          error: 'No profile found' 
        };
        diagnostic.issues.push('User profile does not exist in user_profiles table');
        diagnostic.solutions.push('✓ Create a profile entry with approval_status="approved" and is_active=true');
        diagnostic.solutions.push('✓ Run this SQL in Supabase: INSERT INTO user_profiles (user_id, full_name, approval_status, is_active) VALUES (\'' + userId + '\', \'Your Name\', \'approved\', true)');
      } else {
        diagnostic.steps[1] = { 
          name: 'User Profile Check', 
          status: 'success',
          data: profileData 
        };

        // Check approval status
        if (profileData.approval_status !== 'approved') {
          diagnostic.issues.push(`User not approved (status: ${profileData.approval_status})`);
          diagnostic.solutions.push('✓ Update approval_status to "approved" in user_profiles table');
          diagnostic.solutions.push('✓ SQL: UPDATE user_profiles SET approval_status=\'approved\' WHERE user_id=\'' + userId + '\'');
        }

        // Check active status
        if (!profileData.is_active) {
          diagnostic.issues.push('User account is inactive');
          diagnostic.solutions.push('✓ Update is_active to true in user_profiles table');
          diagnostic.solutions.push('✓ SQL: UPDATE user_profiles SET is_active=true WHERE user_id=\'' + userId + '\'');
        }
      }

      // Step 3: Check User Role
      diagnostic.steps.push({ name: 'Checking user role...', status: 'running' });
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        diagnostic.steps[2] = { 
          name: 'User Role Check', 
          status: 'failed',
          error: roleError.message 
        };
        diagnostic.issues.push('Role check failed: ' + roleError.message);
      } else if (!roleData) {
        diagnostic.steps[2] = { 
          name: 'User Role Check', 
          status: 'failed',
          error: 'No role found' 
        };
        diagnostic.issues.push('User role does not exist in user_roles table');
        diagnostic.solutions.push('✓ Create a role entry (e.g., teacher, school_admin, or super_admin)');
        diagnostic.solutions.push('✓ SQL: INSERT INTO user_roles (user_id, role) VALUES (\'' + userId + '\', \'teacher\')');
      } else {
        diagnostic.steps[2] = { 
          name: 'User Role Check', 
          status: 'success',
          data: roleData 
        };
      }

      // Step 4: Check School Assignment (if applicable)
      if (profileData && roleData?.role !== 'super_admin') {
        diagnostic.steps.push({ name: 'Checking school assignment...', status: 'running' });
        
        if (!profileData.school_id) {
          diagnostic.steps[3] = { 
            name: 'School Assignment Check', 
            status: 'warning',
            error: 'No school assigned' 
          };
          diagnostic.issues.push('User not assigned to any school');
          diagnostic.solutions.push('✓ Assign user to a school by updating school_id in user_profiles table');
        } else {
          const { data: schoolData, error: schoolError } = await supabase
            .from('schools')
            .select('name')
            .eq('id', profileData.school_id)
            .single();

          if (schoolError || !schoolData) {
            diagnostic.steps[3] = { 
              name: 'School Assignment Check', 
              status: 'failed',
              error: 'School not found' 
            };
            diagnostic.issues.push('Assigned school does not exist');
          } else {
            diagnostic.steps[3] = { 
              name: 'School Assignment Check', 
              status: 'success',
              data: { schoolName: schoolData.name }
            };
          }
        }
      }

      // Determine if user can login
      diagnostic.canLogin = 
        profileData && 
        profileData.approval_status === 'approved' && 
        profileData.is_active && 
        roleData;

      // Sign out after diagnostic
      await supabase.auth.signOut();

    } catch (error: any) {
      diagnostic.issues.push('Unexpected error: ' + error.message);
    }

    setResults(diagnostic);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Login Diagnostic Tool
          </CardTitle>
          <CardDescription>
            Test your login credentials and diagnose issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={runDiagnostic} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Diagnostic...
                </>
              ) : (
                'Run Diagnostic'
              )}
            </Button>
          </form>

          {results && (
            <div className="space-y-4 mt-6">
              {/* Overall Status */}
              <Alert variant={results.canLogin ? 'default' : 'destructive'}>
                <AlertDescription className="flex items-center gap-2">
                  {results.canLogin ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">All checks passed! You should be able to log in.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span className="font-semibold">Login issues detected. See below for solutions.</span>
                    </>
                  )}
                </AlertDescription>
              </Alert>

              {/* Diagnostic Steps */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Diagnostic Steps:</h3>
                {results.steps.map((step: any, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-sm p-2 bg-muted rounded">
                    {step.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                    {step.status === 'failed' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                    {step.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />}
                    {step.status === 'running' && <Loader2 className="h-4 w-4 animate-spin mt-0.5" />}
                    <div className="flex-1">
                      <div className="font-medium">{step.name}</div>
                      {step.error && <div className="text-destructive text-xs mt-1">{step.error}</div>}
                      {step.data && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(step.data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Issues */}
              {results.issues.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-red-600">Issues Found:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {results.issues.map((issue: string, index: number) => (
                      <li key={index} className="text-red-600">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Solutions */}
              {results.solutions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-green-600">Solutions:</h3>
                  <ul className="space-y-1 text-sm">
                    {results.solutions.map((solution: string, index: number) => (
                      <li key={index} className="text-green-700 bg-green-50 p-2 rounded">
                        {solution}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/auth'}>
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
