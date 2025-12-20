import { Button, Flex } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import {useGoogleSignIn} from "@/pages/auth/ui/hooks/useGoogleSignIn.ts";

interface GoogleSignInProps {
  mode: 'login' | 'register';
}

export function GoogleSignIn(props: GoogleSignInProps) {

  const buttonText = props.mode === 'login' ? 'Sign in with Google' : 'Sign up with Google';
  const {
    handleDemoGoogleSignIn,
    isLoading,
    isGoogleLoading
  } = useGoogleSignIn();

  return (
    <Flex vertical gap={12}>
      <Button
        block
        shape="round"
        size="large"
        icon={<GoogleOutlined />}
        onClick={handleDemoGoogleSignIn}
        loading={isLoading || isGoogleLoading}
        disabled={isLoading || isGoogleLoading}
      >
        {buttonText} (Demo)
      </Button>
    </Flex>
  );
}