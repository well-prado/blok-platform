const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test data
let testUser1 = {
    email: `testuser1_${Date.now()}@example.com`,
    username: `testuser1_${Date.now()}`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User1'
};

let testUser2 = {
    email: `testuser2_${Date.now()}@example.com`,
    username: `testuser2_${Date.now()}`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User2'
};

let user1Token = '';
let user2Token = '';
let user1Id = '';
let user2Id = '';
let testWorkflowId = '';

async function runPhase3Tests() {
    console.log('🚀 Starting Phase 3 Community Features Tests...\n');

    try {
        // 1. Register two test users
        console.log('1️⃣ Registering test users...');
        
        const user1Response = await axios.post(`${BASE_URL}/auth-register`, testUser1);
        if (user1Response.data.success) {
            user1Token = user1Response.data.token;
            user1Id = user1Response.data.user.id;
            console.log('✅ User 1 registration successful');
        } else {
            throw new Error('User 1 registration failed');
        }

        const user2Response = await axios.post(`${BASE_URL}/auth-register`, testUser2);
        if (user2Response.data.success) {
            user2Token = user2Response.data.token;
            user2Id = user2Response.data.user.id;
            console.log('✅ User 2 registration successful');
        } else {
            throw new Error('User 2 registration failed');
        }

        // 2. Create a test workflow for commenting and rating
        console.log('\n2️⃣ Creating test workflow...');
        
        const workflowData = {
            name: `Test Workflow for Community ${Date.now()}`,
            description: 'A test workflow for community features testing',
            category: 'testing',
            tags: ['test', 'community'],
            isPublic: true,
            trigger: { http: { method: 'GET', path: '/' } },
            steps: [{ name: 'test', node: 'example-node', type: 'module' }],
            nodes: { 'test': { inputs: {} } }
        };

        const workflowResponse = await axios.post(`${BASE_URL}/workflow-create`, workflowData, {
            headers: { Authorization: `Bearer ${user1Token}` }
        });

        if (workflowResponse.data.success) {
            testWorkflowId = workflowResponse.data.workflow._id;
            console.log('✅ Test workflow created successfully');
        } else {
            throw new Error('Test workflow creation failed');
        }

        // 3. Test commenting system
        console.log('\n3️⃣ Testing comment system...');
        
        // Add a comment from user 1
        const commentData = {
            workflowId: testWorkflowId,
            content: 'This is a great workflow! Thanks for sharing.',
            parentCommentId: null
        };

        const commentResponse = await axios.post(`${BASE_URL}/comment-add`, commentData, {
            headers: { Authorization: `Bearer ${user1Token}` }
        });

        if (commentResponse.data.success) {
            console.log('✅ Comment added successfully');
        } else {
            throw new Error('Comment addition failed');
        }

        // Add a reply comment from user 2
        const replyData = {
            workflowId: testWorkflowId,
            content: 'I agree! Very useful workflow.',
            parentCommentId: commentResponse.data.data.id
        };

        const replyResponse = await axios.post(`${BASE_URL}/comment-add`, replyData, {
            headers: { Authorization: `Bearer ${user2Token}` }
        });

        if (replyResponse.data.success) {
            console.log('✅ Reply comment added successfully');
        } else {
            throw new Error('Reply comment addition failed');
        }

        // Get comments for the workflow
        const getCommentsResponse = await axios.get(`${BASE_URL}/comments-get?workflowId=${testWorkflowId}`);
        
        if (getCommentsResponse.data.success && getCommentsResponse.data.comments.length >= 2) {
            console.log('✅ Comments retrieved successfully');
        } else {
            throw new Error('Comments retrieval failed');
        }

        // 4. Test rating system
        console.log('\n4️⃣ Testing rating system...');
        
        // User 1 rates the workflow
        const ratingData1 = {
            workflowId: testWorkflowId,
            rating: 5,
            reviewText: 'Excellent workflow, very well designed!'
        };

        const ratingResponse1 = await axios.post(`${BASE_URL}/workflow-rate`, ratingData1, {
            headers: { Authorization: `Bearer ${user1Token}` }
        });

        if (ratingResponse1.data.success) {
            console.log('✅ User 1 rating added successfully');
        } else {
            throw new Error('User 1 rating failed');
        }

        // User 2 rates the workflow
        const ratingData2 = {
            workflowId: testWorkflowId,
            rating: 4,
            reviewText: 'Good workflow, could use some improvements.'
        };

        const ratingResponse2 = await axios.post(`${BASE_URL}/workflow-rate`, ratingData2, {
            headers: { Authorization: `Bearer ${user2Token}` }
        });

        if (ratingResponse2.data.success) {
            console.log('✅ User 2 rating added successfully');
        } else {
            throw new Error('User 2 rating failed');
        }

        // Get workflow rating information
        const getRatingResponse = await axios.get(`${BASE_URL}/workflow-rating-get?workflowId=${testWorkflowId}`);
        
        if (getRatingResponse.data.success && getRatingResponse.data.rating.count >= 2) {
            console.log(`✅ Rating information retrieved: ${getRatingResponse.data.rating.average}/5 (${getRatingResponse.data.rating.count} ratings)`);
        } else {
            throw new Error('Rating information retrieval failed');
        }

        // 5. Test follow system
        console.log('\n5️⃣ Testing follow system...');
        
        // User 2 follows User 1
        const followData = {
            targetUserId: user1Id
        };

        const followResponse = await axios.post(`${BASE_URL}/user-follow`, followData, {
            headers: { Authorization: `Bearer ${user2Token}` }
        });

        if (followResponse.data.success) {
            console.log('✅ User follow successful');
        } else {
            throw new Error('User follow failed');
        }

        // Get User 1's followers
        const followersResponse = await axios.get(`${BASE_URL}/user-followers?userId=${user1Id}`);
        
        if (followersResponse.data.success && followersResponse.data.users.length >= 1) {
            console.log('✅ Followers list retrieved successfully');
        } else {
            throw new Error('Followers retrieval failed');
        }

        // Get User 2's following list
        const followingResponse = await axios.get(`${BASE_URL}/user-following?userId=${user2Id}`);
        
        if (followingResponse.data.success && followingResponse.data.users.length >= 1) {
            console.log('✅ Following list retrieved successfully');
        } else {
            throw new Error('Following list retrieval failed');
        }

        // 6. Test favorites system
        console.log('\n6️⃣ Testing favorites system...');
        
        // User 2 favorites the workflow
        const favoriteData = {
            workflowId: testWorkflowId
        };

        const favoriteResponse = await axios.post(`${BASE_URL}/workflow-favorite`, favoriteData, {
            headers: { Authorization: `Bearer ${user2Token}` }
        });

        if (favoriteResponse.data.success) {
            console.log('✅ Workflow favorited successfully');
        } else {
            throw new Error('Workflow favorite failed');
        }

        // Get User 2's favorites
        const favoritesResponse = await axios.get(`${BASE_URL}/user-favorites`, {
            headers: { Authorization: `Bearer ${user2Token}` }
        });
        
        if (favoritesResponse.data.success && favoritesResponse.data.workflows.length >= 1) {
            console.log('✅ Favorites list retrieved successfully');
        } else {
            throw new Error('Favorites retrieval failed');
        }

        // 7. Test activity feed
        console.log('\n7️⃣ Testing activity feed...');
        
        // Get User 2's activity feed (should include User 1's activities since User 2 follows User 1)
        const activityResponse = await axios.get(`${BASE_URL}/activity-feed`, {
            headers: { Authorization: `Bearer ${user2Token}` }
        });
        
        if (activityResponse.data.success) {
            console.log(`✅ Activity feed retrieved: ${activityResponse.data.activities.length} activities`);
        } else {
            throw new Error('Activity feed retrieval failed');
        }

        // 8. Test unfollow functionality
        console.log('\n8️⃣ Testing unfollow functionality...');
        
        const unfollowData = {
            targetUserId: user1Id
        };

        const unfollowResponse = await axios.post(`${BASE_URL}/user-unfollow`, unfollowData, {
            headers: { Authorization: `Bearer ${user2Token}` }
        });

        if (unfollowResponse.data.success) {
            console.log('✅ User unfollow successful');
        } else {
            throw new Error('User unfollow failed');
        }

        // 9. Test unfavorite functionality
        console.log('\n9️⃣ Testing unfavorite functionality...');
        
        const unfavoriteData = {
            workflowId: testWorkflowId
        };

        const unfavoriteResponse = await axios.post(`${BASE_URL}/workflow-unfavorite`, unfavoriteData, {
            headers: { Authorization: `Bearer ${user2Token}` }
        });

        if (unfavoriteResponse.data.success) {
            console.log('✅ Workflow unfavorited successfully');
        } else {
            throw new Error('Workflow unfavorite failed');
        }

        // Final success message
        console.log('\n🎉 All Phase 3 Community Features tests passed!');
        console.log('\n📊 Test Results Summary:');
        console.log('✅ User Registration (2 users)');
        console.log('✅ Workflow Creation');
        console.log('✅ Comment System (add comments, replies, get comments)');
        console.log('✅ Rating System (add ratings, get average)');
        console.log('✅ Follow System (follow, get followers/following, unfollow)');
        console.log('✅ Favorites System (favorite, get favorites, unfavorite)');
        console.log('✅ Activity Feed (personalized feed)');
        console.log('\n🚀 Phase 3 Community Features are fully functional!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

// Run the tests
runPhase3Tests(); 