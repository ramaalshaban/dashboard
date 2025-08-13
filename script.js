class MindbricksDashboard {
    constructor() {
        this.usersApiUrl = 'https://beta.mindbricks.com/api/user/users';
        this.projectsApiUrl = 'https://beta.mindbricks.com/api/project/admin/userprojects';
        this.batchApiUrl = 'https://beta.mindbricks.com/api/project/admin/userprojects/batch';
        this.bearerToken = '';
        this.users = [];
        this.userProjects = new Map(); 
        this.selectedUser = null;
        this.isAuthenticated = false;
        
        this.initializeElements();
        this.bindEvents();
        this.checkAuthState();
    }

    initializeElements() {
        // Views
        this.loginView = document.getElementById('loginView');
        this.dashboardView = document.getElementById('dashboardView');
        
        // Login elements
        this.bearerTokenInput = document.getElementById('bearerToken');
        this.loginButton = document.getElementById('loginButton');
        this.loginError = document.getElementById('loginError');
        this.loginErrorMessage = document.getElementById('loginErrorMessage');
        
        // Navigation
        this.logoutButton = document.getElementById('logoutButton');
        this.listUsersTab = document.getElementById('listUsersTab');
        this.usersProjectsTab = document.getElementById('usersProjectsTab');
        
        // Sections
        this.listUsersSection = document.getElementById('listUsersSection');
        this.userProjectsSection = document.getElementById('userProjectsSection');
        
        // List Users elements
        this.totalUsersElement = document.getElementById('totalUsers');
        this.refreshUsersButton = document.getElementById('refreshUsers');
        this.loadingDiv = document.getElementById('loading');
        this.errorDiv = document.getElementById('error');
        this.errorMessage = document.getElementById('errorMessage');
        this.retryButton = document.getElementById('retryButton');
        this.userListDiv = document.getElementById('userList');
        
        // User Projects elements
        this.backToUsersButton = document.getElementById('backToUsers');
        this.userProjectsTitle = document.getElementById('userProjectsTitle');
        this.selectedUserInfo = document.getElementById('selectedUserInfo');
        this.projectsListDiv = document.getElementById('projectsList');
    }

    bindEvents() {
        // Login events
        this.loginButton.addEventListener('click', () => this.handleLogin());
        this.bearerTokenInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        
        // Navigation events
        this.logoutButton.addEventListener('click', () => this.handleLogout());
        this.listUsersTab.addEventListener('click', () => this.showSection('listUsers'));
        this.backToUsersButton.addEventListener('click', () => this.showSection('listUsers'));
        
        // List Users events
        this.refreshUsersButton.addEventListener('click', () => this.loadUsers());
        this.retryButton.addEventListener('click', () => this.loadUsers());
    }

    checkAuthState() {
        // Check if there's a stored token (optional enhancement)
        const storedToken = localStorage.getItem('mindbricks_token');
        if (storedToken) {
            this.bearerToken = storedToken;
            this.bearerTokenInput.value = storedToken;
        }
    }

    showLoginView() {
        this.loginView.classList.remove('hidden');
        this.dashboardView.classList.add('hidden');
        this.isAuthenticated = false;
    }

    showDashboardView() {
        this.loginView.classList.add('hidden');
        this.dashboardView.classList.remove('hidden');
        this.isAuthenticated = true;
        this.showSection('listUsers');
        this.loadUsers();
    }

    showSection(sectionName) {
        // Hide all sections
        this.listUsersSection.classList.remove('active');
        this.userProjectsSection.classList.add('hidden');
        
        // Update navigation
        this.listUsersTab.classList.remove('active');
        
        if (sectionName === 'listUsers') {
            this.listUsersSection.classList.add('active');
            this.listUsersTab.classList.add('active');
        } else if (sectionName === 'userProjects') {
            this.userProjectsSection.classList.remove('hidden');
            this.userProjectsSection.classList.add('active');
        }
    }

    async handleLogin() {
        const token = this.bearerTokenInput.value.trim();
        
        if (!token) {
            this.showLoginError('Please enter a Bearer token');
            return;
        }

        this.loginButton.disabled = true;
        this.loginButton.textContent = 'Logging in...';
        this.hideLoginError();

        try {
            // Test the token by making a request
            const response = await fetch(this.usersApiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(this.getErrorMessage(response.status));
            }

            // Token is valid
            this.bearerToken = token;
            localStorage.setItem('mindbricks_token', token);
            this.showDashboardView();

        } catch (error) {
            this.showLoginError(error.message);
        } finally {
            this.loginButton.disabled = false;
            this.loginButton.textContent = 'Login';
        }
    }

    handleLogout() {
        this.bearerToken = '';
        this.users = [];
        this.userProjects.clear();
        this.selectedUser = null;
        localStorage.removeItem('mindbricks_token');
        this.bearerTokenInput.value = '';
        this.userListDiv.innerHTML = '';
        this.totalUsersElement.textContent = '0';
        this.showLoginView();
    }

    showLoginError(message) {
        this.loginErrorMessage.textContent = message;
        this.loginError.classList.remove('hidden');
    }

    hideLoginError() {
        this.loginError.classList.add('hidden');
    }

    showLoading() {
        this.loadingDiv.classList.remove('hidden');
        this.errorDiv.classList.add('hidden');
        this.refreshUsersButton.disabled = true;
    }

    hideLoading() {
        this.loadingDiv.classList.add('hidden');
        this.refreshUsersButton.disabled = false;
    }

    showError(message) {
        this.hideLoading();
        this.errorMessage.textContent = message;
        this.errorDiv.classList.remove('hidden');
    }

    hideError() {
        this.errorDiv.classList.add('hidden');
    }

    getErrorMessage(status) {
        switch (status) {
            case 401:
                return 'Invalid or expired Bearer token. Please check your token.';
            case 403:
                return 'Access forbidden. You may not have permission.';
            case 404:
                return 'API endpoint not found.';
            case 500:
            case 502:
            case 503:
                return 'Server error. Please try again later.';
            default:
                return `HTTP ${status}: Request failed.`;
        }
    }

    async fetchUsers() {
        const response = await fetch(this.usersApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.bearerToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(this.getErrorMessage(response.status));
        }

        return await response.json();
    }

    async fetchUserProjects(userId) {
        const response = await fetch(`${this.projectsApiUrl}/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.bearerToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(this.getErrorMessage(response.status));
        }

        const data = await response.json();
        return data.projects || [];
    }

    async fetchUserProjectsBatch(userIds, includeProjects = true) {
        const response = await fetch(this.batchApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.bearerToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIds: userIds,
                includeProjects: includeProjects
            })
        });

        if (!response.ok) {
            throw new Error(this.getErrorMessage(response.status));
        }

        const data = await response.json();
        return data;
    }

    async getUserProjectCount(userId) {
        // Check cache first
        if (this.userProjects.has(userId)) {
            return this.userProjects.get(userId).length;
        }

        try {
            const projects = await this.fetchUserProjects(userId);
            this.userProjects.set(userId, projects);
            return projects.length;
        } catch (error) {
            console.error(`Error fetching projects for user ${userId}:`, error);
            return 0; // Return 0 if we can't fetch projects
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async renderUsers(users) {
        this.userListDiv.innerHTML = '';
        this.totalUsersElement.textContent = users.length;

        if (!users || users.length === 0) {
            this.userListDiv.innerHTML = `
                <div class="empty-state">
                    <h3>No Users Found</h3>
                    <p>The API returned an empty list of users.</p>
                </div>
            `;
            return;
        }

        // Create user cards with loading state for project counts
        for (const user of users) {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.onclick = () => this.showUserProjects(user);
            
            userCard.innerHTML = `
                <div class="user-card-header">
                    <div class="user-name">${this.escapeHtml(user.name)}</div>
                    <div class="project-count" id="count-${user.id}">Loading...</div>
                </div>
                <div class="user-id">ID: ${this.escapeHtml(user.id)}</div>
                <div class="user-date">Created: ${this.formatDate(user.createdAt)}</div>
            `;
            
            this.userListDiv.appendChild(userCard);
        }

        // Use batch API to load all project data efficiently
        await this.loadAllProjectsDataBatch(users);
    }

    async loadProjectCountForUser(userId) {
        try {
            const projectCount = await this.getUserProjectCount(userId);
            const countElement = document.getElementById(`count-${userId}`);
            if (countElement) {
                countElement.textContent = `${projectCount} project${projectCount !== 1 ? 's' : ''}`;
            }
        } catch (error) {
            const countElement = document.getElementById(`count-${userId}`);
            if (countElement) {
                countElement.textContent = '0 projects';
            }
        }
    }

    // New optimized method using batch API
    async loadAllProjectsDataBatch(users) {
        try {
            const userIds = users.map(user => user.id);
            
            // Fetch all project data in one API call
            const batchData = await this.fetchUserProjectsBatch(userIds, true);
            
            // Cache the project data and update UI
            if (batchData.results) {
                for (const userId in batchData.results) {
                    const userData = batchData.results[userId];
                    
                    // Cache the projects
                    this.userProjects.set(userId, userData.projects || []);
                    
                    // Update the project count in the UI
                    const countElement = document.getElementById(`count-${userId}`);
                    if (countElement) {
                        const projectCount = userData.projectCount || 0;
                        countElement.textContent = `${projectCount} project${projectCount !== 1 ? 's' : ''}`;
                    }
                }
            }
        } catch (error) {
            console.error('Batch loading error:', error);
            
            // Fallback to individual loading if batch fails
            console.log('Falling back to individual project loading...');
            for (const user of users) {
                this.loadProjectCountForUser(user.id);
            }
        }
    }

    async showUserProjects(user) {
        this.selectedUser = user;
        this.userProjectsTitle.textContent = `${user.name}'s Projects`;
        
        // Render user info
        this.selectedUserInfo.innerHTML = `
            <div class="user-info-header">
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div class="user-details">
                    <h3>${this.escapeHtml(user.name)}</h3>
                    <p>Member since ${this.formatDate(user.createdAt)}</p>
                    <p>User ID: ${this.escapeHtml(user.id)}</p>
                </div>
            </div>
        `;

        this.showSection('userProjects');

        // Check if we already have projects data from batch call
        if (this.userProjects.has(user.id)) {
            const projects = this.userProjects.get(user.id);
            this.renderProjects(projects);
            return;
        }
        
        // Show loading state for projects
        this.projectsListDiv.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading projects...</p>
            </div>
        `;

        try {
            // Fallback: Fetch projects for this user individually
            const projects = await this.fetchUserProjects(user.id);
            this.userProjects.set(user.id, projects);
            this.renderProjects(projects);
        } catch (error) {
            console.error('Error loading user projects:', error);
            this.projectsListDiv.innerHTML = `
                <div class="error">
                    <p>Failed to load projects: ${error.message}</p>
                    <button onclick="window.dashboard.showUserProjects(window.dashboard.selectedUser)">Retry</button>
                </div>
            `;
        }
    }

    renderProjects(projects) {
        this.projectsListDiv.innerHTML = '';

        if (!projects || projects.length === 0) {
            this.projectsListDiv.innerHTML = `
                <div class="empty-state">
                    <h3>No Projects Found</h3>
                    <p>This user doesn't have any projects yet.</p>
                </div>
            `;
            return;
        }

        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            const title = project.shortname || 'Untitled Project';
            const projectId = project.id || 'No project ID available';
            const description = project.description || 'No description available';
            const createdAt = project.createdAt || 'No date available';
            
            projectCard.innerHTML = `
                <div class="project-id">${this.escapeHtml(projectId)}</div>
                <div class="project-title">${this.escapeHtml(title)}</div>
                <div class="project-description">${this.escapeHtml(description)}</div>
                <div class="project-meta">
                    <span>Created: ${this.formatDate(createdAt)}</span>
                </div>
            `;
            
            this.projectsListDiv.appendChild(projectCard);
        });
    }

    async loadUsers() {
        if (!this.isAuthenticated) return;

        this.showLoading();
        this.hideError();

        try {
            const users = await this.fetchUsers();
            this.users = users;
            await this.renderUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError(error.message || 'Failed to load users. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new MindbricksDashboard();
});
