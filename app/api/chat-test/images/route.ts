import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/modules/auth/lib/jwtUtils';
import { CustomImage } from '@/modules/chat-test/hooks/useImageUpload'; 


const MOCK_STORAGE = new Map<string, CustomImage[]>(); 


async function getImagesForSession(sessionId: string, userId: string): Promise<CustomImage[]> {
    console.log(`Fetching images for session ${sessionId}, user ${userId}`);
    
    if (sessionId === 'test-session-123') {
        return MOCK_STORAGE.get(sessionId) || [];
    }
    return [];
}


async function addImageToSession(
    sessionId: string,
    userId: string,
    file: File
): Promise<CustomImage> {
    console.log(`Adding image for session ${sessionId}, user ${userId}: ${file.name}`);
    
    
    if (sessionId !== 'test-session-123') {
        throw new Error('Cannot add image to this session.');
    }

    
    const imageId = `img-${Date.now()}`;
    
    const imageUrl = `/uploads/session-${sessionId}/${imageId}-${file.name}`;
    const newImage: CustomImage = {
        id: imageId,
        url: imageUrl,
        thumbnail: imageUrl, 
    };

    const currentImages = MOCK_STORAGE.get(sessionId) || [];
    MOCK_STORAGE.set(sessionId, [...currentImages, newImage]);

    await new Promise(resolve => setTimeout(resolve, 100)); 
    return newImage;
}


async function deleteImageFromSession(sessionId: string, userId: string, imageId: string): Promise<void> {
    console.log(`Deleting image ${imageId} for session ${sessionId}, user ${userId}`);
    
    if (sessionId !== 'test-session-123') {
        throw new Error('Cannot delete image from this session.');
    }

    const currentImages = MOCK_STORAGE.get(sessionId) || [];
    const updatedImages = currentImages.filter(img => img.id !== imageId);

    if (updatedImages.length === currentImages.length) {
        
        console.log(`Image ${imageId} not found in session ${sessionId}.`);
    } else {
         MOCK_STORAGE.set(sessionId, updatedImages);
         
    }
    await new Promise(resolve => setTimeout(resolve, 50)); 
}



export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const validationResult = await validateToken(token);
    if (!validationResult.isValid || !validationResult.user?.id) {
        return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    if (!sessionId) {
        return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
    }

    try {
        const images = await getImagesForSession(sessionId, validationResult.user.id);
        return NextResponse.json(images);
    } catch (error) {
        console.error(`Error fetching images for session ${sessionId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
        return NextResponse.json({ message: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const validationResult = await validateToken(token);
    if (!validationResult.isValid || !validationResult.user?.id) {
        return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    let formData;
    try {
        formData = await request.formData();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid request body: Expected FormData' }, { status: 400 });
    }

    const file = formData.get('image') as File | null;
    const sessionId = formData.get('sessionId') as string | null;
    const userId = validationResult.user.id;

    if (!sessionId) {
        return NextResponse.json({ message: 'Session ID is required in form data' }, { status: 400 });
    }
    if (!file) {
        return NextResponse.json({ message: 'Image file is required in form data' }, { status: 400 });
    }

    
    if (!(file instanceof File)) {
         return NextResponse.json({ message: 'Invalid image data' }, { status: 400 });
    }

    try {
        const newImage = await addImageToSession(sessionId, userId, file);
        return NextResponse.json(newImage, { status: 201 });
    } catch (error: any) {
        console.error(`Error uploading image for session ${sessionId}:`, error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const imageId = searchParams.get('imageId');
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const validationResult = await validateToken(token);
    if (!validationResult.isValid || !validationResult.user?.id) {
        return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    if (!sessionId || !imageId) {
        return NextResponse.json({ message: 'Session ID and Image ID are required' }, { status: 400 });
    }

    try {
        await deleteImageFromSession(sessionId, validationResult.user.id, imageId);
        return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 });
        
        
    } catch (error: any) {
        console.error(`Error deleting image ${imageId} for session ${sessionId}:`, error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
} 