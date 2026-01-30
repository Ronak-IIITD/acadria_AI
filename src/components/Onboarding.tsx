import { useState, useEffect } from 'react';
import { User as FirebaseUser, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { BookOpen, Sparkles, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingProps {
  user: FirebaseUser;
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'profile' | 'preferences' | 'complete';

const Onboarding = ({ user, onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(25);

  const interestOptions = [
    'Programming', 'Mathematics', 'Science', 'History',
    'Literature', 'Business', 'Medicine', 'Law',
    'Design', 'Engineering', 'Languages', 'Other'
  ];

  useEffect(() => {
    const stepProgress = {
      'welcome': 25,
      'profile': 50,
      'preferences': 75,
      'complete': 100
    };
    setProgress(stepProgress[currentStep]);
  }, [currentStep]);

  const handleNext = () => {
    const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'preferences', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'preferences', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      if (auth.currentUser && displayName) {
        await updateProfile(auth.currentUser, {
          displayName: displayName
        });
      }

      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Acadira AI
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Your personal AI study companion. Let's set up your account in just 3 simple steps.
            </p>

            <div className="flex justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Upload Docs</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Ask Questions</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Learn Faster</p>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              What should we call you?
            </h2>
            <p className="text-gray-600 mb-8">
              This is how you'll appear in the app
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your email is linked to your Google account
                </p>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              What are you studying?
            </h2>
            <p className="text-gray-600 mb-8">
              Select topics you're interested in (choose as many as you want)
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    interests.includes(interest)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {interests.includes(interest) && (
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  )}
                  {interest}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500 mt-4">
              Selected: {interests.length} topics
            </p>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-6">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              You're all set!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Welcome aboard, {displayName || 'Student'}! Start uploading your documents and ask questions.
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Quick Tips:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Upload PDFs, Word docs, or text files</li>
                <li>• Ask specific questions about your content</li>
                <li>• Use highlights to mark important sections</li>
                <li>• Try different AI models for best results</li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-1">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full">
          {renderStep()}
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-200 px-4 py-6">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 'welcome'}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-0 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          {currentStep === 'complete' ? (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Setting up...' : 'Get Started'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={currentStep === 'profile' && !displayName.trim()}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
